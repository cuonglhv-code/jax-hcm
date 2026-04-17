import React, { ReactNode } from 'react';
export { useForm, Controller, FormProvider, useFormContext } from 'react-hook-form';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  hint?: ReactNode;
}

export function FormField({ label, error, required, children, hint }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-text-base">
        {label}{required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-text-muted">{hint}</p>}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
