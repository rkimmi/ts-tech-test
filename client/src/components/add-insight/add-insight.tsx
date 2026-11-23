import { type FormEvent, useState } from "react";
import {
  CreateInsightRequest,
  type CreateInsightValidationErrors,
  type Insight,
} from "@suittracker/lib/dtos";
import { BRANDS } from "../../lib/consts.ts";
import { createInsight } from "../../services/insight.api.ts";
import { Button } from "../button/button.tsx";
import { Modal, type ModalProps } from "../modal/modal.tsx";
import styles from "./add-insight.module.css";

type AddInsightProps = ModalProps & {
  onCreated?(insight: Insight): void;
};

const NO_ERRORS: CreateInsightValidationErrors = {
  formErrors: [],
  fieldErrors: {},
};

export const AddInsight = ({ onCreated, ...props }: AddInsightProps) => {
  const [brandId, setBrandId] = useState(BRANDS[0].id);
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<CreateInsightValidationErrors>(
    NO_ERRORS,
  );
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
