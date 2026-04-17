import React, { InputHTMLAttributes, ReactNode, forwardRef } from 'react';
import { FormField } from './Form';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: ReactNode;
  prefixIcon?: ReactNode;
  suffixIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefixIcon, suffixIcon, className = '', ...props }, ref) => {
    
    const hasError = !!error;
    const paddingLeft = prefixIcon ? 'pl-9' : 'pl-3';
    const paddingRight = suffixIcon ? 'pr-9' : 'pr-3';

    const inputClasses = `
      w-full ${paddingLeft} ${paddingRight} py-2 text-sm bg-surface-2 border rounded-md text-text-base 
      placeholder:text-text-faint focus:outline-none focus:ring-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
      ${hasError ? 'border-error focus:ring-error/30 focus:border-error' : 'border-border focus:ring-primary/30 focus:border-primary'}
      ${className}
    `;

    const inputContent = (
      <div className="relative flex items-center w-full">
        {prefixIcon && (
          <div className="absolute left-3 text-text-muted pointer-events-none flex items-center justify-center">
            {prefixIcon}
          </div>
        )}
        <input ref={ref} className={inputClasses} aria-invalid={hasError ? "true" : "false"} {...props} />
        {suffixIcon && (
          <div className="absolute right-3 text-text-muted flex items-center justify-center">
            {suffixIcon}
          </div>
        )}
      </div>
    );

    if (label) {
      return (
        <FormField label={label} error={error} required={props.required} hint={hint}>
          {inputContent}
        </FormField>
      );
    }

    return inputContent;
  }
);

Input.displayName = 'Input';
