import type { Metadata } from "next";
import { GeistSans, GeistMono } from 'geist/font';
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Toaster from "@/components/Toaster";

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
    title: "Zone Wallet System",
    description: "A modern wallet management system",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${geistSans.className} ${geistMono.className}`}>
            <body className="antialiased">
                <AuthProvider>
                    {children}
                    <Toaster />
                </AuthProvider>
            </body>
        </html>
    );
}
