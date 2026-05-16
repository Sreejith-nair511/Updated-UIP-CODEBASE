import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";
import { Toaster } from "sonner";
import { AssistantDock } from "@/components/assistant/AssistantDock";

export const metadata: Metadata = {
  title: "Digital Stethoscope — Water Leak Detection",
  description: "AI-powered IoT platform for real-time water leak detection using acoustic vibration analysis",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)",  color: "#0a0e1a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <ThemeProvider>
            {children}
            <AssistantDock />
            <Toaster
              position="top-right"
              richColors
              closeButton
              theme="system"
              toastOptions={{ duration: 5000 }}
            />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
