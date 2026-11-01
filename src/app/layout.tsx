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
  title: "Escalas iLoc — Sistema de Escala de Trabalho",
  description: "Sistema web de gestão de escalas de trabalho e folgas para equipe",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Escalas iLoc",
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
    <html lang="pt-BR" className={`${plusJakarta.variable} h-full antialiased`} suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans antialiased select-none pb-safe"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
