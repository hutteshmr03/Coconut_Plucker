import React from 'react';

export const Select = ({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  error,
  hint,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`field ${className}`}>
      {label && (
        <label htmlFor={name}>
          {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !error && <div className="field-hint">{hint}</div>}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
};
