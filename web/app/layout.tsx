import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEONA Dashboard",
  description: "SEO audit dashboard powered by Claude Code CLI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
