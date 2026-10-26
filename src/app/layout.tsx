import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Lapor GA",
  description: "Aplikasi Pelaporan dan Pelacakan Permintaan General Affairs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={poppins.variable}>
      <body className="min-h-screen bg-[#FFFFFF] text-[#1C1917] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
