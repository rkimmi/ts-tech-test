import { useId, useState } from "react";
import { Trash2Icon } from "lucide-react";
import { cx } from "../../lib/cx.ts";
import { deleteInsight } from "../../services/insight.api.ts";
import styles from "./insights.module.css";
import type { Insight } from "@suittracker/lib/dtos";

type InsightsProps = {
  insights: Insight[];
  className?: string;
  onDeleted?(id: Insight["id"]): void;
};

export const Insights = ({ insights, className, onDeleted }: InsightsProps) => {
  const [deleting, setDeleting] = useState<Set<Insight["id"]>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const idPrefix = useId();

  const setIsDeleting = (id: Insight["id"], isDeleting: boolean) =>
    setDeleting((prev) => {
      const next = new Set(prev);
      if (isDeleting) next.add(id);
      else next.delete(id);
      return next;
    });

  const handleDelete = async (id: Insight["id"]) => {
    if (deleting.has(id)) return;
    setIsDeleting(id, true);
    setError(null);
    try {
      await deleteInsight(id);
      onDeleted?.(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsDeleting(id, false);
    }
  };

  return (
    <div className={cx(className)}>
      <h1 className={styles.heading}>Insights</h1>
      {error && <p role="alert">Couldn't delete insight: {error}</p>}
      <div className={styles.list}>
        {insights?.length
          ? (
            insights.map(({ id, text, date, brandId }) => (
              <article
                className={styles.insight}
                key={id}
                aria-labelledby={`${idPrefix}-insight-${id}`}
              >
                <div className={styles["insight-meta"]}>
                  <span>{brandId}</span>
                  <div className={styles["insight-meta-details"]}>
                    <span>{date.toString()}</span>
                    <button
                      type="button"
                      className={styles["insight-delete-button"]}
                      aria-label="Delete insight"
                      title="Delete insight"
                      disabled={deleting.has(id)}
                      onClick={() => handleDelete(id)}
                    >
                      <Trash2Icon className={styles["insight-delete"]} />
                    </button>
                  </div>
                </div>
                <p
                  id={`${idPrefix}-insight-${id}`}
                  className={styles["insight-content"]}
                >
                  {text}
                </p>
              </article>
            ))
          )
          : <p>We have no insight!</p>}
      </div>
    </div>
  );
};
