"use client";

import { Button } from "@/components/ui/Button";
import { GlassContainer } from "@/components/ui/GlassContainer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [role, setRole] = useState<string>("student");
  const router = useRouter();

  const roles = [
    { value: "student", label: "Student" },
    { value: "faculty", label: "Faculty" },
    { value: "recruiter", label: "Recruiter" },
  ];

  const handleRoleChange = (value: string) => {
    setRole(value);
    console.log(value);
  };

  const handleProceed = () => {
    switch(role){
        case "student":
            router.push("/studentForm");
            break;
        case "faculty":
            router.push("/forms/faculty");
            break;
        case "recruiter":
            router.push("/forms/recruiter");
            break;
        default:
            router.push("/");
            break;
    }
  };

  return (
    <main
      style={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <GlassContainer
        style={{ maxWidth: "400px", width: "100%", padding: "40px" }}
      >
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-medium text-center">Select Role</h1>
          <div className="flex flex-col gap-4 justify-center items-start">
            {roles.map((r) => (
              <label
                key={r.value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                  padding: "12px",
                  borderRadius: "8px",
                  width: "100%",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--liquid-bg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <div style={{ position: "relative", display: "inline-block" }}>
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={role === r.value}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    style={{
                      width: "20px",
                      height: "20px",
                      cursor: "pointer",
                      appearance: "none",
                      WebkitAppearance: "none",
                      MozAppearance: "none",
                      border:
                        role === r.value
                          ? "2px solid var(--md-sys-color-primary)"
                          : "2px solid var(--input-border)",
                      borderRadius: "50%",
                      position: "relative",
                      transition: "all 0.2s ease",
                      backgroundColor:
                        role === r.value
                          ? "var(--md-sys-color-primary)"
                          : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (role !== r.value) {
                        e.currentTarget.style.borderColor =
                          "var(--md-sys-color-primary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (role !== r.value) {
                        e.currentTarget.style.borderColor =
                          "var(--input-border)";
                      }
                    }}
                  />
                  {role === r.value && (
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "var(--md-sys-color-on-primary)",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </div>
                <span
                  style={{
                    fontSize: "1rem",
                    color: "var(--md-sys-color-on-surface)",
                    userSelect: "none",
                  }}
                >
                  {r.label}
                </span>
              </label>
            ))}
          </div>

          <Button className="right-0" onClick={handleProceed}>Proceed</Button>
        </div>
      </GlassContainer>
    </main>
  );
}
