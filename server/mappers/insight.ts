import type { Insight } from "$models/insight.ts";
import type * as dtos from "@suittracker/lib/dtos";

export const toInsightDto = (insight: Insight): dtos.Insight => ({
  id: insight.id,
  brandId: insight.brand,
  date: insight.createdAt,
  text: insight.text,
});
