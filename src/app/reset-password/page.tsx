"use client";

import { useState } from "react";
import { GlassContainer } from "@/components/ui/GlassContainer";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: "",
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (formData.password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        setIsLoading(true);

        try {
            // Simulate API request
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    // Simulate failure if password is "fail"
                    if (formData.password === "fail") {
                        reject(new Error("Failed to reset password"));
                    } else {
                        resolve(true);
                    }
                }, 1500);
            });

            toast.success("Password reset successfully!");
            router.push("/login");

        } catch (error: any) {
            toast.error(`Request failed: ${error.message || "Unknown error"}`);
        } finally {
            setIsLoading(false);
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
                style={{ maxWidth: "450px", width: "100%", padding: "40px" }}
            >
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <h1
                        style={{
                            fontSize: "1.75rem",
                            marginBottom: "0.5rem",
                            fontWeight: 700,
                        }}
                    >
                        Reset Password
                    </h1>
                    <p style={{ color: "var(--md-sys-color-secondary)" }}>
                        Enter your new password below
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
                >
                    <FormInput
                        label="New Password"
                        type="password"
                        placeholder="Enter new password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={8}
                    />

                    <FormInput
                        label="Confirm Password"
                        type="password"
                        placeholder="Confirm new password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        minLength={8}
                    />

                    <Button
                        variant="filled"
                        type="submit"
                        disabled={isLoading}
                        style={{ height: "48px", fontSize: "1rem", marginTop: "0.5rem" }}
                    >
                        {isLoading ? "Resetting..." : "Reset Password"}
                    </Button>

                    <div style={{ textAlign: "center", marginTop: "1rem" }}>
                        <Link
                            href="/login"
                            style={{
                                color: "var(--md-sys-color-primary)",
                                textDecoration: "none",
                                fontSize: "0.875rem",
                            }}
                        >
                            Back to Login
                        </Link>
                    </div>
                </form>
            </GlassContainer>
        </main>
    );
}
