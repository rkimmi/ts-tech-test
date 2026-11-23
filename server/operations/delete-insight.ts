import type { HasDBClient } from "../shared.ts";

type Input = HasDBClient & {
  id: number;
};

/** Deletes insight by id. Returns false if it didn't exist. */
export default (input: Input): boolean => {
  console.log(`Deleting insight id=${input.id}`);

  const rows = input.db.sql<{ id: number }>`
    DELETE FROM insights WHERE id = ${input.id} RETURNING id
  `;

  const deleted = rows.length > 0;
  console.log(deleted ? `Insight ${input.id} deleted` : `Requested insight ${input.id} to delete not found`);
  return deleted;
};
