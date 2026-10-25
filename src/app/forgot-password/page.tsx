"use client";

import { useState } from "react";
import { GlassContainer } from "@/components/ui/GlassContainer";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simple email validation
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error("Please enter a valid email address");
            setIsLoading(false);
            return;
        }

        try {
            // Simulate API request
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    // Simulate failure for specific email to demonstrate error handling if needed, 
                    // or just success for now.
                    // Let's make it fail for "fail@test.com"
                    if (email === "fail@test.com") {
                        reject(new Error("User not found"));
                    } else {
                        resolve(true);
                    }
                }, 1500);
            });

            toast.success("Reset email sent successfully!");
            setEmail(""); // Clear input on success

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
                        Forgot Password?
                    </h1>
                    <p style={{ color: "var(--md-sys-color-secondary)" }}>
                        Enter your email to receive a reset link
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
                >
                    <FormInput
                        label="Email Address"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <Button
                        variant="filled"
                        type="submit"
                        disabled={isLoading}
                        style={{ height: "48px", fontSize: "1rem", marginTop: "0.5rem" }}
                    >
                        {isLoading ? "Sending..." : "Send Reset Link"}
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
