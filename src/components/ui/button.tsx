import React from 'react';
import { cn } from '@/lib/utils';

export const Button = React.forwardRef<HTMLButtonElement, any>(({ className, children, variant = 'default', size, ...props }, ref) => {
  return (
    <button ref={ref} className={cn('inline-flex items-center justify-center rounded-md py-2 px-3 text-sm', className)} {...props}>
      {children}
    </button>
  );
});
Button.displayName = 'Button';

export default Button;
