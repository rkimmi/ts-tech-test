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

export const CreateInsightRequest: z.ZodObject<{
  brandId: z.ZodNumber;
  text: z.ZodString;
}> = Insight.pick({ brandId: true }).extend({
  text: z.string().trim().min(1),
});

export type CreateInsightRequest = z.infer<typeof CreateInsightRequest>;
export type CreateInsightResponse = Insight;
export type CreateInsightValidationErrors = z.inferFlattenedErrors<
  typeof CreateInsightRequest
>;
export type CreateInsightErrorResponse = {
  error: CreateInsightValidationErrors;
};
