"use client";
import RecruiterForm from "../RecruiterForm";
import { GlassContainer } from "@/components/ui/GlassContainer";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RecruiterFormPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return null;

  return <main
    style={{
      minHeight: "calc(100vh - 64px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}
  >
    <GlassContainer
      style={{ maxWidth: "600px", width: "100%", padding: "40px" }}
    >
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "2rem",
            marginBottom: "0.5rem",
            fontWeight: 700,
          }}
        >
          Recruiter Registration
        </h1>
        <p style={{ color: "var(--md-sys-color-secondary)" }}>
          Please fill in your company details
        </p>
      </div>
      <RecruiterForm />
    </GlassContainer>
  </main>;
}
