"use client";

import { useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { IconEye, IconEyeOff } from "@/components/ui/Icons";
import styles from "./TextField.module.css";

type TextFieldProps = {
  label: string;
  error?: string;
  multiline?: boolean;
} & (
  | (InputHTMLAttributes<HTMLInputElement> & { multiline?: false })
  | (TextareaHTMLAttributes<HTMLTextAreaElement> & { multiline: true })
);

export function TextField({
  label,
  error,
  multiline,
  id,
  className,
  ...rest
}: TextFieldProps) {
  const fieldId = id ?? rest.name;
  const isPassword =
    !multiline &&
    (rest as InputHTMLAttributes<HTMLInputElement>).type === "password";
  const [revealed, setRevealed] = useState(false);

  return (
    <label className={styles.field} htmlFor={fieldId}>
      <span className={styles.label}>{label}</span>
      {multiline ? (
        <textarea
          id={fieldId}
          className={[styles.textarea, className ?? ""].join(" ")}
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : isPassword ? (
        <span className={styles.inputWrap}>
          <input
            id={fieldId}
            className={[styles.input, styles.inputWithToggle, className ?? ""].join(
              " ",
            )}
            {...(rest as InputHTMLAttributes<HTMLInputElement>)}
            type={revealed ? "text" : "password"}
          />
          <button
            type="button"
            className={styles.revealButton}
            onClick={() => setRevealed((prev) => !prev)}
            aria-label={revealed ? "비밀번호 숨기기" : "비밀번호 보기"}
          >
            {revealed ? <IconEye size={20} /> : <IconEyeOff size={20} />}
          </button>
        </span>
      ) : (
        <input
          id={fieldId}
          className={[styles.input, className ?? ""].join(" ")}
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {error ? <span className={styles.error}>{error}</span> : null}
    </label>
  );
}
