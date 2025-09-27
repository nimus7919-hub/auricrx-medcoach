import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auric RX",
  description: "Premium black & gold sign-in for Auric RX",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
