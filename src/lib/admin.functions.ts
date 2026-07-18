import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AuthCtx = {
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }> };
  userId: string;
};

async function assertAdmin(context: AuthCtx) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || data !== true) {
    throw new Error("Forbidden: admin role required");
  }
}

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as unknown as AuthCtx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: usersData, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (usersErr) throw new Error("Could not list users");

    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const adminIds = new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));

    return usersData.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      createdAt: u.created_at,
      isAdmin: adminIds.has(u.id),
    }));
  });

const setAdminSchema = z.object({
  email: z.string().trim().email().max(255),
  grant: z.boolean(),
  password: z.string().min(8).max(72).optional(),
});

export const setAdminByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => setAdminSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as AuthCtx;
    await assertAdmin(ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Find the user by email
    const { data: usersData, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (usersErr) throw new Error("Could not list users");
    let user = usersData.users.find(
      (u) => (u.email ?? "").toLowerCase() === data.email.toLowerCase(),
    );

    // Optionally create the account if it doesn't exist yet
    if (!user && data.grant) {
      if (!data.password) {
        return { ok: false as const, reason: "not_found" as const };
      }
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
      });
      if (createErr || !created.user) throw new Error("Could not create user");
      user = created.user;
    }

    if (!user) return { ok: false as const, reason: "not_found" as const };

    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw new Error("Could not grant role");
    } else {
      if (user.id === ctx.userId) {
        return { ok: false as const, reason: "self" as const };
      }
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", user.id)
        .eq("role", "admin");
      if (error) throw new Error("Could not revoke role");
    }

    return { ok: true as const };
  });
