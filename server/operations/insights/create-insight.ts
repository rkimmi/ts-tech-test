import type { Insight } from "$models/insight.ts";
import type { HasDBClient } from "../../shared.ts";
import type * as insightsTable from "$tables/insights.ts";

type Input = HasDBClient & Pick<Insight, "brand" | "text">;

export default (input: Input): Insight => {
  const [row] = input.db.sql<insightsTable.Row>`
    INSERT INTO insights (brand, text)
    VALUES (${input.brand}, ${input.text})
    RETURNING *
  `;

  return { ...row, createdAt: new Date(row.createdAt) };
};
