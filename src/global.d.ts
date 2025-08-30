interface Navigator {
  canShare?: (data?: { files?: File[]; title?: string; text?: string; url?: string }) => boolean;
}

declare module '*.svg' {
  const content: any;
  export default content;
}
