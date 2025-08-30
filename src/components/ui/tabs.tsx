import React from 'react';

export const Tabs = ({ children }: any) => <div>{children}</div>;
export const TabsList = ({ children, className }: any) => <div className={className}>{children}</div>;
export const TabsTrigger = ({ children, value }: any) => <button>{children}</button>;
export const TabsContent = ({ children, value }: any) => <div>{children}</div>;

export default Tabs;
