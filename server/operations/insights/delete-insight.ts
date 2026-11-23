import type { HasDBClient } from "../../shared.ts";

type Input = HasDBClient & {
  id: number;
};

/** Deletes insight by id. Returns false if it didn't exist. */
export default (input: Input): boolean => {
  const rows = input.db.sql<{ id: number }>`
    DELETE FROM insights WHERE id = ${input.id} RETURNING id
  `;

  return rows.length > 0;
};
