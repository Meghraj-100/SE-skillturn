"use client";

import { Button } from "@/components/ui/Button";
import { GlassContainer } from "@/components/ui/GlassContainer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [state, setState] = useState<string>("login");
    const router = useRouter();

    const { login, register } = useAuth();
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        full_name: "",
        username: "",
        email: "",
        password: "",
        role: "student" as "student" | "faculty" | "admin" | "recruiter",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (state === "login") {
                const user = await login(formData.username, formData.password);

                if (!user.is_verified) {
                    switch (user.role) {
                        case "student":
                            router.push("/studentForm");
                            break;
                        case "faculty":
                            router.push("/forms/faculty");
                            break;
                        case "recruiter":
                            router.push("/forms/recruiter");
                            break;
                    }
                } else {
                    switch (user.role) {
                        case "student":
                            router.push("/dashboard");
                            break;
                        case "faculty":
                            router.push("/facultydash");
                            break;
                        case "recruiter":
                            router.push("/recruiter_dashboard");
                            break;
                    }
                }
            } else {
                const user = await register({
                    username: formData.username,
                    email: formData.email,
                    full_name: formData.full_name,
                    password: formData.password,
                    role: formData.role,
                });

                // Assuming new registration always starts as unverified
                if (!user.is_verified) {
                    switch (user.role) {
                        case "student":
                            router.push("/studentForm");
                            break;
                        case "faculty":
                            router.push("/forms/faculty");
                            break;
                        case "recruiter":
                            router.push("/forms/recruiter");
                            break;
                    }
                } else {
                    switch (user.role) {
                        case "student":
                            router.push("/dashboard");
                            break;
                        case "faculty":
                            router.push("/facultydash");
                            break;
                        case "recruiter":
                            router.push("/recruiter_dashboard");
                            break;
                    }
                }
            }
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
                style={{ maxWidth: "400px", width: "100%", padding: "40px" }}
            >
                {state === "login" ? (
                    <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                        <h1
                            style={{
                                fontSize: "2rem",
                                marginBottom: "0.5rem",
                                fontWeight: 700,
                            }}
                        >
                            Welcome Back
                        </h1>
                        <p style={{ color: "var(--md-sys-color-secondary)" }}>
                            Sign in to access your dashboard
                        </p>
                    </div>
                ) : (
                    <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                        <h1
                            style={{
                                fontSize: "2rem",
                                marginBottom: "0.5rem",
                                fontWeight: 700,
                            }}
                        >
                            Create Account
                        </h1>
                        <p style={{ color: "var(--md-sys-color-secondary)" }}>
                            Sign up to get started with your dashboard
                        </p>
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
                >
                    {error && (
                        <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>
                    )}
                    {state !== "login" && (
                        <>
                            <div>
                                <label
                                    htmlFor="full_name"
                                    style={{
                                        display: "block",
                                        marginBottom: "0.5rem",
                                        fontWeight: 500,
                                    }}
                                >
                                    Full Name
                                </label>
                                <input
                                    id="full_name"
                                    name="full_name"
                                    type="text"
                                    placeholder="John Doe"
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border: "1px solid var(--input-border)",
                                        background: "var(--input-background)",
                                        color: "var(--input-color)",
                                        fontSize: "1rem",
                                    }}
                                    value={formData.full_name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="email"
                                    style={{
                                        display: "block",
                                        marginBottom: "0.5rem",
                                        fontWeight: 500,
                                    }}
                                >
                                    Email
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border: "1px solid var(--input-border)",
                                        background: "var(--input-background)",
                                        color: "var(--input-color)",
                                        fontSize: "1rem",
                                    }}
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="role"
                                    style={{
                                        display: "block",
                                        marginBottom: "0.5rem",
                                        fontWeight: 500,
                                    }}
                                >
                                    Role
                                </label>
                                <select
                                    id="role"
                                    name="role"
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border: "1px solid var(--input-border)",
                                        background: "var(--input-background)",
                                        color: "var(--input-color)",
                                        fontSize: "1rem",
                                    }}
                                    value={formData.role}
                                    onChange={handleChange}
                                >
                                    <option value="student">Student</option>
                                    <option value="faculty">Faculty</option>
                                    <option value="recruiter">Recruiter</option>
                                    {/* Admin registration usually restricted, but keeping options open if needed */}
                                    {/* <option value="admin">Admin</option> */}
                                </select>
                            </div>
                        </>
                    )}
                    <div>
                        <label
                            htmlFor="username"
                            style={{
                                display: "block",
                                marginBottom: "0.5rem",
                                fontWeight: 500,
                            }}
                        >
                            Username
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            placeholder="username"
                            required
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "8px",
                                border: "1px solid var(--input-border)",
                                background: "var(--input-background)",
                                color: "var(--input-color)",
                                fontSize: "1rem",
                            }}
                            value={formData.username}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            style={{
                                display: "block",
                                marginBottom: "0.5rem",
                                fontWeight: 500,
                            }}
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            minLength={4}
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "8px",
                                border: "1px solid var(--input-border)",
                                background: "var(--input-background)",
                                color: "var(--input-color)",
                                fontSize: "1rem",
                            }}
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            fontSize: "0.875rem",
                        }}
                    >
                        <Link
                            href="/forgot-password"
                            style={{
                                color: "var(--md-sys-color-primary)",
                                textDecoration: "none",
                            }}
                        >
                            Forgot password?
                        </Link>
                    </div>

                    <Button
                        variant="filled"
                        type="submit"
                        disabled={isLoading}
                        style={{ height: "48px", fontSize: "1rem", marginTop: "0.5rem" }}
                    >
                        {isLoading ? (state === "login" ? "Signing in..." : "Signing up...") : (state === "login" ? "Sign In" : "Sign Up")}
                    </Button>
                </form>

                {/* <div style={{ margin: '2rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--input-border)' }} />
                    <span style={{ color: 'var(--md-sys-color-secondary)', fontSize: '0.875rem' }}>Or continue with</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--input-border)' }} />
                </div> */}

                {/* <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button
                        type="button"
                        onClick={() => alert("Google login not implemented yet")}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '10px',
                            background: 'var(--input-background)',
                            border: '1px solid var(--input-border)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: 'var(--input-color)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                    </button>
                    <button
                        type="button"
                        onClick={() => alert("GitHub login not implemented yet")}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '10px',
                            background: 'var(--input-background)',
                            border: '1px solid var(--input-border)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: 'var(--input-color)',
                            transition: 'all 0.2s'
                        }}
                    >
                         <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405 1.02 0 2.04.135 3 .405 2.28-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        GitHub
                    </button>
                </div> */}

                <div
                    style={{
                        marginTop: "2rem",
                        textAlign: "center",
                        fontSize: "0.875rem",
                    }}
                >
                    <p
                        onClick={() =>
                            setState((prev) => (prev === "login" ? "register" : "login"))
                        }
                        style={{ color: "var(--md-sys-color-secondary)", cursor: 'pointer' }}
                    >
                        {state === "login"
                            ? "Don't have an account?"
                            : "Already have an account?"}
                        <span
                            style={{
                                color: "var(--md-sys-color-primary)",
                                fontWeight: 600,
                                marginLeft: '4px'
                            }}
                        >
                            click here
                        </span>
                    </p>
                </div>

                <div
                    style={{
                        marginTop: "1rem",
                        textAlign: "center",
                        fontSize: "0.875rem",
                        borderTop: "1px solid var(--input-border)",
                        paddingTop: "1rem",
                    }}
                >
                    <p style={{ color: "var(--md-sys-color-secondary)", marginBottom: "0.5rem" }}>
                        Representing a company?
                    </p>
                    <Link href="/org-sign-up">
                        <Button
                            variant="outlined"
                            style={{ width: "100%" }}
                        >
                            Sign up as Organisation
                        </Button>
                    </Link>
                </div>
            </GlassContainer>
        </main>
    );
}
