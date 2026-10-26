"use client";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function FormsLanding() {
  const router = useRouter();

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "48px auto",
        display: "flex",
        flexDirection: "column",
        gap: 32,
        alignItems: "center",
      }}
    >
        <div
          style={{
            marginTop: 42,
            color: "var(--md-sys-color-on-background)",
            opacity: 0.7,
            fontSize: "1.1rem",
          }}
          className="flex flex-col justify-center gap-4"
        >
          <p>Select a role to begin onboarding</p>
          <Button
            variant="filled"
            className="mt-4"
            onClick={() => router.push("/roles")}
          >
            Back to roles
          </Button>
        </div>
    </div>
  );
}
