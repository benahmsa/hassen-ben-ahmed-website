import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestIP } from "@tanstack/react-start/server";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email().max(255),
  subject: z.string().trim().max(200).optional().default(""),
  message: z.string().trim().min(1).max(5000),
  turnstileToken: z.string().min(1).max(4096),
});

export const getTurnstileSiteKey = createServerFn({ method: "GET" }).handler(async () => {
  return { siteKey: process.env.TURNSTILE_SITE_KEY ?? "" };
});

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((data) => contactSchema.parse(data))
  .handler(async ({ data }) => {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      return { ok: false as const, reason: "config" as const };
    }

    let remoteip: string | undefined;
    try {
      remoteip = getRequestIP({ xForwardedFor: true }) ?? undefined;
    } catch {
      remoteip = undefined;
    }

    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", data.turnstileToken);
    if (remoteip) body.set("remoteip", remoteip);

    let verify: { success: boolean; "error-codes"?: string[] } = { success: false };
    try {
      const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body,
      });
      verify = (await res.json()) as typeof verify;
    } catch {
      return { ok: false as const, reason: "turnstile" as const };
    }
    if (!verify.success) {
      return { ok: false as const, reason: "turnstile" as const };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      subject: data.subject ?? "",
      message: data.message,
    });
    if (error) {
      return { ok: false as const, reason: "server" as const };
    }
    return { ok: true as const };
  });
