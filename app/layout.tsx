import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OB Workspace",
  description: "Sistema integral de gestión del trabajo interno de OtherBrain S.R.L.",
};

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, type Theme } from "@/components/theme-provider";
import { BackgroundParticles } from "@/components/floating-leaves";
import { cookies } from "next/headers";

import { Toaster } from "sonner";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = (cookieStore.get("theme")?.value as Theme) || "dark";

  return (
    <html
      lang="es"
      className={`${inter.variable} h-full antialiased ${theme}`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <ThemeProvider initialTheme={theme}>
          <BackgroundParticles />
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
