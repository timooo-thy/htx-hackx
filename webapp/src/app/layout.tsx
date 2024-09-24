import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConvexProvider from "./providers";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import Footer from "@/components/footer";
import Navbar from "@/components/nav-bar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HTX Sentinel",
  description: "One stop solution for all your surveillance needs.",
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
            <Footer />
            <Toaster richColors />
          </ConvexProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
