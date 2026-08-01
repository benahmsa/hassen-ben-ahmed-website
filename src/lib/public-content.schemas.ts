import { z } from "zod";

export const categorySchema = z.object({
  category: z.enum(["commentary", "media"]),
});

export const slugSchema = z.object({
  slug: z.string().min(1).max(240),
});