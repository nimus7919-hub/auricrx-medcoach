import React from 'react';

export const ScrollArea = ({ children, className }: any) => <div className={className} style={{ overflow: 'auto' }}>{children}</div>;

export default ScrollArea;
