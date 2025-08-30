import React from 'react';
import { cn } from '@/lib/utils';

export const Select = ({ children, value, onValueChange, className }: any) => (
  <select value={value} onChange={(e) => onValueChange?.(e.target.value)} className={cn(className)}>
    {children}
  </select>
);

export const SelectTrigger = ({ children, className }: any) => <div className={className}>{children}</div>;
export const SelectValue = ({ placeholder }: any) => <span>{placeholder}</span>;
export const SelectContent = ({ children }: any) => <div>{children}</div>;
export const SelectGroup = ({ children }: any) => <div>{children}</div>;
export const SelectItem = ({ children, value }: any) => <option value={value}>{children}</option>;
export const SelectLabel = ({ children }: any) => <div>{children}</div>;

export default Select;
