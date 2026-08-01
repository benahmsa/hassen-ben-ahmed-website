import { z } from "zod";

export const setAdminSchema = z.object({
  email: z.string().trim().email().max(255),
  grant: z.boolean(),
  password: z.string().min(8).max(72).optional(),
});