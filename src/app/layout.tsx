import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono, Poppins } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ZelQ CRM",
  description: "Internal work management for ZelQ Solutions.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jakarta.className} ${geistMono.variable} ${poppins.variable} h-full antialiased`}>
      <body className="min-h-full bg-background font-sans text-foreground" suppressHydrationWarning>
        <TooltipProvider>
          {children}
          <Toaster theme="light" />
        </TooltipProvider>
      </body>
    </html>
  );
}
