import React from 'react';

type WithFieldProps = {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
};

const baseFieldClasses =
  'block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm transition-colors focus:outline-none disabled:bg-gray-50 disabled:text-gray-500';

const stateClasses = (error?: string) =>
  error
    ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-500/20'
    : 'border-gray-200 focus:border-secondary-400 focus:ring-2 focus:ring-secondary-500/20';

function Label({ id, label, required }: { id?: string; label?: string; required?: boolean }) {
  if (!label) return null;
  return (
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-0.5" aria-hidden>*</span>}
    </label>
  );
}

function HelpRow({
  id,
  error,
  helperText,
}: {
  id?: string;
  error?: string;
  helperText?: string;
}) {
  if (error) {
    return (
      <p id={id ? `${id}-error` : undefined} className="mt-1.5 text-xs text-red-600">
        {error}
      </p>
    );
  }
  if (helperText) {
    return (
      <p id={id ? `${id}-helper` : undefined} className="mt-1.5 text-xs text-gray-500">
        {helperText}
      </p>
    );
  }
  return null;
}

interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    WithFieldProps {}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  helperText,
  required = false,
  fullWidth = true,
  leftIcon,
  rightSlot,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      <Label id={id} label={label} required={required} />
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            {leftIcon}
          </span>
        )}
        <input
          id={id}
          {...props}
          className={`${baseFieldClasses} ${stateClasses(error)} ${
            leftIcon ? 'pl-10' : ''
          } ${rightSlot ? 'pr-10' : ''} ${className}`}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${id}-error` : helperText ? `${id}-helper` : undefined
          }
        />
        {rightSlot && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
            {rightSlot}
          </span>
        )}
      </div>
      <HelpRow id={id} error={error} helperText={helperText} />
    </div>
  );
};

interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    WithFieldProps {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  error,
  helperText,
  required = false,
  fullWidth = true,
  options,
  placeholder,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      <Label id={id} label={label} required={required} />
      <div className="relative">
        <select
          id={id}
          {...props}
          className={`${baseFieldClasses} ${stateClasses(error)} appearance-none pr-9 ${className}`}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${id}-error` : helperText ? `${id}-helper` : undefined
          }
        >
          <option value="">{placeholder ?? `Select ${label?.toLowerCase() ?? 'an option'}`}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <HelpRow id={id} error={error} helperText={helperText} />
    </div>
  );
};

interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    WithFieldProps {}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  error,
  helperText,
  required = false,
  fullWidth = true,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      <Label id={id} label={label} required={required} />
      <textarea
        id={id}
        {...props}
        className={`${baseFieldClasses} ${stateClasses(error)} min-h-[96px] resize-y leading-relaxed ${className}`}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${id}-error` : helperText ? `${id}-helper` : undefined
        }
      />
      <HelpRow id={id} error={error} helperText={helperText} />
    </div>
  );
};
