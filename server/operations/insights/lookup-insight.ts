import type { Insight } from "$models/insight.ts";
import type { HasDBClient } from "../../shared.ts";
import type * as insightsTable from "$tables/insights.ts";

type Input = HasDBClient & {
  id: number;
};

export default (input: Input): Insight | undefined => {
  const [row] = input.db
    .sql<
    insightsTable.Row
  >`SELECT * FROM insights WHERE id = ${input.id} LIMIT 1`;

  if (!row) return;

  return { ...row, createdAt: new Date(row.createdAt) };
};
