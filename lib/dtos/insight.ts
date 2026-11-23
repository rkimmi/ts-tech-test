import { z } from "zod";

export const Insight: z.ZodObject<{
  id: z.ZodNumber;
  brandId: z.ZodNumber;
  date: z.ZodDate;
  text: z.ZodString;
}> = z.object({
  id: z.number().int().min(0),
  brandId: z.number().int().min(0),
  date: z.coerce.date(),
  text: z.string(),
});

export type Insight = z.infer<typeof Insight>;
