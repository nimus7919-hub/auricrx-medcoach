import React from 'react';

export const Select = ({ children, value, onValueChange }: any) => (
  <select value={value} onChange={(e) => onValueChange?.(e.target.value)}>
    {children}
  </select>
);

export const SelectTrigger = ({ children, className }: any) => <div className={className}>{children}</div>;
export const SelectValue = ({ placeholder }: any) => <span>{placeholder}</span>;
export const SelectContent = ({ children }: any) => <div>{children}</div>;
export const SelectGroup = ({ children }: any) => <div>{children}</div>;
export const SelectItem = ({ children, value }: any) => <option value={value}>{children}</option>;

export default Select;
