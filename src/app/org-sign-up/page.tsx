"use client";

import { Button } from "@/components/ui/Button";
import { GlassContainer } from "@/components/ui/GlassContainer";
import { FormInput } from "@/components/ui/FormInput";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function OrganizationSignupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        website: "",
        industry: "",
        company_size: "",
        description: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch("http://localhost:8000/companies", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                let errorMessage = "Failed to register organization";
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorMessage;
                } catch {
                    // generic error
                }
                throw new Error(errorMessage);
            }

            // Success
            router.push("/login?role=recruiter"); // Redirect to login or appropriate page
        } catch (err: any) {
            setError(err.message || "An error occurred");
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
                        Organization Registration
                    </h1>
                    <p style={{ color: "var(--md-sys-color-secondary)" }}>
                        Register your company to post jobs and opportunities
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
                >
                    {error && (
                        <div style={{ color: "var(--md-sys-color-error)", textAlign: "center" }}>{error}</div>
                    )}

                    <FormInput
                        label="Company Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Acme Corp"
                    />

                    <FormInput
                        label="Website"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://example.com"
                    />

                    <FormInput
                        label="Industry"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        placeholder="e.g. Technology, Education"
                    />

                    <div>
                        <label
                            htmlFor="company_size"
                            style={{
                                display: "block",
                                marginBottom: "0.5rem",
                                fontWeight: 500,
                                color: "var(--input-color)",
                            }}
                        >
                            Company Size
                        </label>
                        <select
                            id="company_size"
                            name="company_size"
                            value={formData.company_size}
                            onChange={handleChange}
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "8px",
                                border: "1px solid var(--input-border)",
                                background: "var(--input-background)",
                                color: "var(--input-color)",
                                fontSize: "1rem",
                            }}
                        >
                            <option value="">Select size</option>
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-500">201-500 employees</option>
                            <option value="500+">500+ employees</option>
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="description"
                            style={{
                                display: "block",
                                marginBottom: "0.5rem",
                                fontWeight: 500,
                                color: "var(--input-color)",
                            }}
                        >
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Tell us about your company..."
                            rows={4}
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "8px",
                                border: "1px solid var(--input-border)",
                                background: "var(--input-background)",
                                color: "var(--input-color)",
                                fontSize: "1rem",
                                resize: "vertical",
                            }}
                        />
                    </div>

                    <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                        <Link href="/login" style={{ flex: 1 }}>
                            <Button
                                variant="outlined"
                                type="button"
                                style={{ width: "100%", height: "48px" }}
                            >
                                Cancel
                            </Button>
                        </Link>
                        <div style={{ flex: 1 }}>
                            <Button
                                variant="filled"
                                type="submit"
                                disabled={isLoading}
                                style={{ width: "100%", height: "48px" }}
                            >
                                {isLoading ? "Registering..." : "Register"}
                            </Button>
                        </div>
                    </div>
                </form>
            </GlassContainer>
        </main>
    );
}
