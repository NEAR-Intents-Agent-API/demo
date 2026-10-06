import { z } from "zod";

export const createAgentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give the agent account a name you will recognise later.")
    .max(100, "Keep it under 100 characters."),
});
export type CreateInput = z.infer<typeof createAgentSchema>;
