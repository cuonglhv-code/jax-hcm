import React, { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { Input } from './Input';
import { FormField } from './Form';

export interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value'> {
  label?: string;
  error?: string;
  hint?: ReactNode;
  isRange?: boolean;
  startDate?: string;
  endDate?: string;
  value?: string;
  onRangeChange?: (start: string, end: string) => void;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, hint, isRange, startDate, endDate, value, onChange, onRangeChange, ...props }, ref) => {
    
    if (isRange) {
      const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onRangeChange) onRangeChange(e.target.value, endDate || '');
      };
      
      const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onRangeChange) onRangeChange(startDate || '', e.target.value);
      };

      const rangeContent = (
        <div className="flex items-center gap-2">
          <Input 
            type="date" 
            value={startDate || ''} 
            onChange={handleStartChange} 
            {...props} 
            className="flex-1"
          />
          <span className="text-text-muted select-none">&ndash;</span>
          <Input 
            type="date" 
            value={endDate || ''} 
            onChange={handleEndChange} 
            {...props} 
            className="flex-1"
          />
        </div>
      );

      if (label) {
        return (
          <FormField label={label} error={error} required={props.required} hint={hint}>
            {rangeContent}
          </FormField>
        );
      }
      return rangeContent;
    }

    return (
      <Input
        ref={ref}
        type="date"
        label={label}
        error={error}
        hint={hint}
        value={value || ''}
        onChange={onChange}
        {...props}
      />
    );
  }
);

DatePicker.displayName = 'DatePicker';
