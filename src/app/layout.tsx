import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { siteConfig } from "@/lib/site-config";

import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const marketingMotionBootScript = `
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.dataset.marketingMotion = 'enabled';
  }
`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Future Physicians | Healthcare opportunities, organized",
    template: "%s | Future Physicians",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    title: "Future Physicians | Build your path into healthcare",
    description: siteConfig.description,
    siteName: siteConfig.name,
    type: "website",
    url: siteConfig.url,
    images: [
      {
        url: "/og.png",
        width: 1731,
        height: 909,
        alt: "Future Physicians — Build your path into healthcare",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Future Physicians | Build your path into healthcare",
    description: siteConfig.description,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  initialScale: 1,
  viewportFit: "cover",
  width: "device-width",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: marketingMotionBootScript }}
          id="marketing-motion-boot"
        />
      </head>
      <body className="flex min-h-full flex-col">
        <ClerkProvider>{children}</ClerkProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
