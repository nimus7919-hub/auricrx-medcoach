import React from 'react';

export const Dialog = ({ children, open }: any) => open ? <div className="dialog">{children}</div> : null;
export const DialogContent = ({ children, className }: any) => <div className={className}>{children}</div>;
export const DialogHeader = ({ children }: any) => <div>{children}</div>;
export const DialogTitle = ({ children }: any) => <div>{children}</div>;
export const DialogFooter = ({ children, className }: any) => <div className={className}>{children}</div>;

export default Dialog;
