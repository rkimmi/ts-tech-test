export const createTable = `
  CREATE TABLE IF NOT EXISTS insights (
    id INTEGER PRIMARY KEY ASC NOT NULL,
    brand INTEGER NOT NULL,
    createdAt TEXT NOT NULL
      DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      -- Must be a UTC ISO string, e.g., 2026-11-25T09:05:00.000Z
      CHECK (strftime('%Y-%m-%dT%H:%M:%fZ', createdAt) IS createdAt),
    text TEXT NOT NULL
  )
`;

export type Row = {
  id: number;
  brand: number;
  createdAt: string;
  text: string;
};

export type Insert = {
  brand: number;
  createdAt: string;
  text: string;
};
