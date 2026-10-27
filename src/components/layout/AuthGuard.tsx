"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

const protectedRoutes = [
  "/dashboard",
  "/facultydash",
  "/facultyprofile",
  "/recruiter_dashboard",
  "/recruiterAnalytics",
  "/r-posted_jobs",
  "/resume",
  "/roles",
  "/forms",
  "/studentForm",
  "/studentProfiles",
  "/add-project",
  "/add-skill"
];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  useEffect(() => {
    if (!loading && isProtected && !user) {
      router.push("/login");
    }
  }, [user, loading, isProtected, router]);

  // If on a protected route and still loading auth state, show a clean loading spinner
  if (isProtected && loading) {
    return (
      <div style={{
        display: "flex",
        height: "80vh",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "16px",
        color: "var(--md-sys-color-on-surface, #fff)"
      }}>
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          border: "3px solid rgba(168, 85, 247, 0.2)",
          borderTopColor: "#a855f7",
          animation: "spin 1s linear infinite"
        }} />
        <p style={{ margin: 0, opacity: 0.8, fontSize: "0.95rem" }}>Authenticating...</p>
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If on a protected route and finished loading but no user, render nothing (useEffect will redirect to /login)
  if (isProtected && !loading && !user) {
    return null;
  }

  return <>{children}</>;
}
