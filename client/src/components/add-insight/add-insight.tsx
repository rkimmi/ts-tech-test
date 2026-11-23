import { type FormEvent, useState } from "react";
import type { z } from "zod";
import { CreateInsightRequest, Insight } from "@suittracker/lib/dtos";
import { BRANDS } from "../../lib/consts.ts";
import { Button } from "../button/button.tsx";
import { Modal, type ModalProps } from "../modal/modal.tsx";
import styles from "./add-insight.module.css";

type AddInsightProps = ModalProps & {
  onCreated?(insight: Insight): void;
};

type ValidationErrors = z.inferFlattenedErrors<typeof CreateInsightRequest>;

type CreateResult =
  | { ok: true; insight: Insight }
  | { ok: false; errors: ValidationErrors };

const NO_ERRORS: ValidationErrors = { formErrors: [], fieldErrors: {} };

const createInsight = async (
  request: CreateInsightRequest,
): Promise<CreateResult> => {
  const res = await fetch("/api/insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (res.status === 400) {
    const body: { error: ValidationErrors } = await res.json();
    return { ok: false, errors: body.error };
  }
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }

  return { ok: true, insight: Insight.parse(await res.json()) };
};

export const AddInsight = ({ onCreated, ...props }: AddInsightProps) => {
  const [brandId, setBrandId] = useState(BRANDS[0].id);
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>(NO_ERRORS);
  const [submitting, setSubmitting] = useState(false);

  const addInsight = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate before sending to server
    const parsed = CreateInsightRequest.safeParse({ brandId, text });
    if (!parsed.success) {
      setErrors(parsed.error.flatten());
      return;
    }

    setSubmitting(true);
    setErrors(NO_ERRORS);
    try {
      const result = await createInsight(parsed.data);
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      setText("");
      onCreated?.(result.insight);
      props.onClose();
    } catch (err) {
      setErrors({
        formErrors: [err instanceof Error ? err.message : String(err)],
        fieldErrors: {},
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal {...props}>
      <h1 className={styles.heading}>Add a new insight</h1>
      <form className={styles.form} onSubmit={addInsight} noValidate>
        <label className={styles.field}>
          Brand
          <select
            className={styles["field-input"]}
            value={brandId}
            onChange={(e) => setBrandId(Number(e.target.value))}
          >
            {BRANDS.map(({ id, name }) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          {errors.fieldErrors.brandId?.map((msg) => (
            <span key={msg} className={styles.error} role="alert">{msg}</span>
          ))}
        </label>
        <label className={styles.field}>
          Insight
          <textarea
            className={styles["field-input"]}
            rows={5}
            placeholder="Something insightful..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {errors.fieldErrors.text?.map((msg) => (
            <span key={msg} className={styles.error} role="alert">{msg}</span>
          ))}
        </label>
        {errors.formErrors.map((msg) => (
          <p key={msg} className={styles.error} role="alert">{msg}</p>
        ))}
        <Button
          className={styles.submit}
          type="submit"
          label={submitting ? "Adding..." : "Add insight"}
          disabled={submitting}
        />
      </form>
    </Modal>
  );
};
