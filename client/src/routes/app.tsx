import { useEffect, useState } from "react";
import { Header } from "../components/header/header.tsx";
import { Insights } from "../components/insights/insights.tsx";
import { fetchWithRetry } from "../lib/fetch-with-retry.ts";
import styles from "./app.module.css";
import type { Insight } from "@suittracker/lib/dtos";

export const App = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchWithRetry("/api/insights", { signal: controller.signal })
      .then((res) => res.json())
      .then(setInsights)
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
      });

    return () => controller.abort();
  }, []);

  return (
    <main className={styles.main}>
      <Header />
      {error && <p role="alert">Couldn't load insights: {error}</p>}
      <Insights className={styles.insights} insights={insights} />
    </main>
  );
};
