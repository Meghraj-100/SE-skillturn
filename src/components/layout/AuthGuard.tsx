"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

const protectedRoutes = [
  "/dashboard",
  "/facultydash",
  "/facultyprofile",
  "/opportunities",
  "/roles",
  "/forms",
  "/studentForm"
];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
      if (isProtected && !user) {
        router.push("/");
      }
    }
  }, [user, loading, pathname, router]);

  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  // If on a protected route and still loading auth state, show nothing or a spinner
  if (isProtected && loading) {
    return null; // Or return a loading spinner if preferred
  }

  // If on a protected route and finished loading but no user, render nothing (useEffect will redirect)
  // This prevents flash of content before redirect
  if (isProtected && !loading && !user) {
    return null;
  }

  return <>{children}</>;
}
