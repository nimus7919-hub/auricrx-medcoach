import React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, any>(({ className, ...props }, ref) => {
  return <input ref={ref} className={cn('px-3 py-2 border rounded-md', className)} {...props} />;
});
Input.displayName = 'Input';

export default Input;
