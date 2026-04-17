import React, { SelectHTMLAttributes, forwardRef, ReactNode } from 'react';
import { FormField } from './Form';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: ReactNode;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, className = '', multiple, ...props }, ref) => {
    
    const hasError = !!error;
    const selectClasses = `
      w-full pl-3 pr-8 py-2 text-sm bg-surface-2 border rounded-md text-text-base 
      focus:outline-none focus:ring-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
      ${hasError ? 'border-error focus:ring-error/30 focus:border-error' : 'border-border focus:ring-primary/30 focus:border-primary'}
      ${multiple ? 'h-auto py-1' : ''}
      ${className}
    `;

    const selectContent = (
      <select
        ref={ref}
        className={selectClasses}
        aria-invalid={hasError ? "true" : "false"}
        multiple={multiple}
        size={multiple ? Math.min(options.length, 5) : undefined}
        {...props}
      >
        {props.placeholder && <option value="" disabled hidden>{props.placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );

    if (label) {
      return (
        <FormField label={label} error={error} required={props.required} hint={hint}>
          {selectContent}
        </FormField>
      );
    }

    return selectContent;
  }
);

Select.displayName = 'Select';
