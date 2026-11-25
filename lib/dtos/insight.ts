import { z } from "zod";

export const Insight: z.ZodObject<{
  id: z.ZodNumber;
  brandId: z.ZodNumber;
  date: z.ZodPipeline<z.ZodString, z.ZodDate>;
  text: z.ZodString;
}> = z.object({
  id: z.number().int().min(0),
  brandId: z.number().int().min(0),
  // Must include a time zone (Z or an offset)
  date: z.string().datetime({ offset: true }).pipe(z.coerce.date()),
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
export const CreateInsightErrorResponse: z.ZodObject<{
  error: z.ZodObject<{
    formErrors: z.ZodArray<z.ZodString>;
    fieldErrors: z.ZodObject<{
      brandId: z.ZodOptional<z.ZodArray<z.ZodString>>;
      text: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }>;
  }>;
}> = z.object({
  error: z.object({
    formErrors: z.array(z.string()),
    fieldErrors: z.object({
      brandId: z.array(z.string()).optional(),
      text: z.array(z.string()).optional(),
    }),
  }),
});

export type CreateInsightErrorResponse = z.infer<
  typeof CreateInsightErrorResponse
>;

export const ListInsightsResponse: z.ZodObject<{
  items: z.ZodArray<typeof Insight>;
}> = z.object({
  items: z.array(Insight),
});

export type ListInsightsResponse = z.infer<typeof ListInsightsResponse>;
