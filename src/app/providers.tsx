"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/context/AuthContext";
import AuthGuard from "@/components/layout/AuthGuard";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
            <AuthProvider>
                {/* <AuthGuard> */}
                    {children}
                {/* </AuthGuard> */}
            </AuthProvider>
        </ThemeProvider>
    );
}
