import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GrowthOS Kids — The Digital Growth Record of Every Child",
    template: "%s | GrowthOS Kids",
  },
  description:
    "AI-powered child growth operating system. Track academics, habits, skills, physical development, and more for children aged 5–18.",
  keywords: ["child growth", "parenting app", "education tracking", "AI tutor", "habit tracker"],
  authors: [{ name: "GrowthOS Kids" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    type: "website",
    siteName: "GrowthOS Kids",
    title: "GrowthOS Kids",
    description: "The Digital Growth Record of Every Child",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6E51FF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('growthos-theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const isDark = stored ? stored === 'dark' : prefersDark;
                if (isDark) document.documentElement.classList.add('dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased" style={{ background: "var(--surface-muted)" }}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#fff",
              color: "#0F0E1A",
              border: "1px solid #E8E5FF",
              borderRadius: "12px",
              fontSize: "14px",
              boxShadow: "0 4px 16px 0 rgb(110 81 255 / 0.10)",
            },
            success: {
              iconTheme: { primary: "#6E51FF", secondary: "#fff" },
            },
          }}
        />
      </body>
    </html>
  );
}
