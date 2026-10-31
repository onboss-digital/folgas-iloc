import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Folgas iLoc — Gestão de Escala 5x2",
  description: "Sistema web de gestão de escalas e folgas 5x2 para equipe",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Folgas iLoc",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#FAF8FF] text-[#131B2E] font-sans antialiased select-none pb-safe">
        {children}
      </body>
    </html>
  );
}
