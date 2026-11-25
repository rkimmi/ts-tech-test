import { useEffect, useState } from "react";
import { Header } from "../components/header/header.tsx";
import { Insights } from "../components/insights/insights.tsx";
import { listInsights } from "../services/insight.api.ts";
import styles from "./app.module.css";
import type { Insight } from "@suittracker/lib/dtos";

export const App = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    listInsights({ signal: controller.signal })
      .then(({ items }) => setInsights(items))
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  return (
    <main className={styles.main}>
      <Header
        onInsightCreated={(insight) =>
          setInsights((prev) => [insight, ...prev])}
      />
      {error && <p role="alert">Couldn't load insights: {error}</p>}
      <Insights
        className={styles.insights}
        insights={insights}
        isLoading={isLoading}
        onDeleted={(id) =>
          setInsights((prev) => prev.filter((insight) => insight.id !== id))}
      />
    </main>
  );
};
