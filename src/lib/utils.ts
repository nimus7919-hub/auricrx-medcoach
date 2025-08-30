export function cn(...args: any[]) {
  return args.flat().filter(Boolean).join(" ");
}
