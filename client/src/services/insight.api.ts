import {
  type CreateInsightErrorResponse,
  type CreateInsightRequest,
  type CreateInsightResponse,
  type CreateInsightValidationErrors,
  Insight,
} from "@suittracker/lib/dtos";
import { fetchWithRetry } from "../lib/fetch-with-retry.ts";

const BASE_URL = "/api/insights";

export type CreateInsightResult =
  | { ok: true; insight: CreateInsightResponse }
  | { ok: false; errors: CreateInsightValidationErrors };

export const listInsights = async (
  { signal }: { signal?: AbortSignal } = {},
): Promise<Insight[]> => {
  const res = await fetchWithRetry(BASE_URL, { signal });
  return res.json();
};

export const createInsight = async (
  request: CreateInsightRequest,
): Promise<CreateInsightResult> => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (res.status === 400) {
    const body: CreateInsightErrorResponse = await res.json();
    return { ok: false, errors: body.error };
  }
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }

  const insight: CreateInsightResponse = Insight.parse(await res.json());
  return { ok: true, insight };
};

export const deleteInsight = async (id: Insight["id"]): Promise<void> => {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 404) { // 404: already removed insight
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
};
