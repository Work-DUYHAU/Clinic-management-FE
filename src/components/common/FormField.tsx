import React from 'react';

export interface FormFieldOption {
  value: string | number;
  label: string;
}

export interface FormFieldProps {
  label: string;
  value: string | number | undefined;
  onChange: (val: string) => void;
  type?: 'text' | 'number' | 'select' | 'textarea' | 'password';
  placeholder?: string;
  options?: FormFieldOption[];
  required?: boolean;
  mono?: boolean;
  bold?: boolean;
  disabled?: boolean;
  className?: string;
  rows?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: string | number;
  autoFocus?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  options,
  required,
  mono,
  bold,
  disabled,
  className = '',
  rows = 3,
  maxLength,
  min,
  max,
  step,
  autoFocus
}) => {
  const baseInputStyle = `w-full px-3 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 transition-all ${
    mono ? 'font-mono' : ''
  } ${bold ? 'font-bold' : 'font-medium'} ${disabled ? 'bg-slate-100 cursor-not-allowed' : ''}`;

  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-[11px] font-semibold text-slate-600">
        {label} {required && <span className="text-rose-500 font-bold">*</span>}
      </label>
      {type === 'select' ? (
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`${baseInputStyle} cursor-pointer`}
        >
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          rows={rows}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          autoFocus={autoFocus}
          className={baseInputStyle}
        />
      ) : (
        <input
          type={type}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          min={min}
          max={max}
          step={step}
          autoFocus={autoFocus}
          className={baseInputStyle}
        />
      )}
    </div>
  );
};
