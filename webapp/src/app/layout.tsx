import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConvexProvider from "./providers";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HTX HackX",
  description: "HTX HacX",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConvexProvider>
            <Navbar />
            {children}
          </ConvexProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
