import React from 'react';

export const Label = ({ children, htmlFor, className }: any) => (
  <label htmlFor={htmlFor} className={className}>{children}</label>
);

export default Label;
