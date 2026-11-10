import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Build Center | ALNStudios",
  description: "Private Minecraft Bedrock build library for ALNStudios.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
