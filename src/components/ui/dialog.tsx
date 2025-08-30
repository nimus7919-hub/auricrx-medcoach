import React from 'react';
import { cn } from '@/lib/utils';

export const Dialog = ({ open, children }: any) => open ? <div className="fixed inset-0 z-50">{children}</div> : null;
export const DialogContent = ({ children, className }: any) => <div className={cn('bg-white rounded-md p-4', className)}>{children}</div>;
export const DialogHeader = ({ children }: any) => <div className="mb-2">{children}</div>;
export const DialogTitle = ({ children }: any) => <h3 className="text-lg font-semibold">{children}</h3>;
export const DialogFooter = ({ children, className }: any) => <div className={cn('mt-4', className)}>{children}</div>;
export const DialogDescription = ({ children }: any) => <p className="text-sm text-muted">{children}</p>;
export const DialogClose = ({ children }: any) => <button>{children}</button>;

export default Dialog;
