import type { Metadata } from "next";
import { Josefin_Sans } from "next/font/google";
import "./globals.css";
import { SocketProvider } from "@/components/SocketProvider";

const josefin = Josefin_Sans({
  subsets: ["latin"],
  variable: "--font-josefin",
});

export const metadata: Metadata = {
  title: "Orion - Voice Communication",
  description: "Connect voices beyond distance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${josefin.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {/* Blurred Background Image */}
        <div 
          className="fixed inset-0 -z-10 bg-[url('/bg.png')] bg-cover bg-center bg-no-repeat blur-sm scale-110 opacity-90" 
        />
        <SocketProvider>
          {children}
        </SocketProvider>
      </body>
    </html>
  );
}
