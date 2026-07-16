import * as React from 'react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`
        w-full px-4 py-2 rounded-lg
        bg-input border border-border
        text-foreground placeholder-muted-foreground
        focus:outline-none focus:ring-2 focus:ring-accent
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all
        ${className}
      `}
      {...props}
    />
  )
);

Input.displayName = 'Input';

export { Input };
