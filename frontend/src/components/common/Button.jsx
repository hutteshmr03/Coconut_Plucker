import React from 'react';

export const Button = ({
  children,
  variant = 'default', // 'primary' | 'gold' | 'ghost' | 'danger' | 'default'
  size = 'md',        // 'sm' | 'md' | 'lg'
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  icon: Icon,
  ...props
}) => {
  const variantClass = {
    primary: 'btn-primary',
    gold: 'btn-gold',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    default: ''
  }[variant] || '';

  const sizeClass = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg'
  }[size] || '';

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />}
      {children}
    </button>
  );
};
