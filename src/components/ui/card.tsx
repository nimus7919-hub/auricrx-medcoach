import React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }: any) {
  return (
    <div className={cn('bg-white rounded-md shadow-sm', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: any) {
  return <div className={cn('p-4 border-b', className)} {...props}>{children}</div>;
}

export function CardTitle({ className, children }: any) {
  return <h3 className={cn('text-lg font-semibold', className)}>{children}</h3>;
}

export function CardContent({ className, children }: any) {
  return <div className={cn('p-4', className)}>{children}</div>;
}

export function CardFooter({ className, children }: any) {
  return <div className={cn('p-4 border-t', className)}>{children}</div>;
}

export default Card;
