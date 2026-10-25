import React from "react";
import styles from "./FormInput.module.css";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  error?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  required = false,
  error,
  ...props
}) => {
  return (
    <div className={styles.inputGroup}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      <input className={styles.input} required={required} {...props} />
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};
