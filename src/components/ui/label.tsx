import React from 'react';
import { cn } from '@/lib/utils';

export const Label = ({ children, className, ...props }: any) => (
  <label className={cn('text-sm font-medium', className)} {...props}>{children}</label>
);

export default Label;
