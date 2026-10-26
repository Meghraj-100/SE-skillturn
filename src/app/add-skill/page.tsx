"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useRouter } from "next/navigation";
import { useState } from "react";

const AVAILABLE_SKILLS = [
    "React", "Node.js", "Python", "Java", "C++",
    "Machine Learning", "Cloud Computing", "AWS", "Docker",
    "SQL", "MongoDB", "Figma", "Adobe XD", "Cyber Security",
    "Data Science", "Blockchain", "DevOps"
];

export default function AddSkillPage() {
    const router = useRouter();
    const [selectedSkill, setSelectedSkill] = useState("");
    const [customSkill, setCustomSkill] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const skillName = customSkill.trim() || selectedSkill.trim();
        if (!skillName) return;

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            const res = await fetch("http://127.0.0.1:8000/student/skills", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name: skillName })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || "Failed to add skill");
            }

            router.push("/dashboard");
        } catch (err: any) {
            console.error("Error adding skill:", err);
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main style={{ padding: '2rem 24px', maxWidth: '800px', margin: '0 auto', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
            <ScrollReveal width="100%">
                <Card variant="elevated" style={{ padding: '2.5rem' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Add New Skill</h1>
                    <p style={{ color: 'var(--md-sys-color-secondary)', marginBottom: '2rem' }}>
                        Select a skill to verify and add to your profile.
                    </p>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {error && (
                            <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.9rem' }}>
                                {error}
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Select from Popular Skills</label>
                            <select
                                value={selectedSkill}
                                onChange={(e) => {
                                    setSelectedSkill(e.target.value);
                                    if (e.target.value) setCustomSkill("");
                                }}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: '1px solid var(--md-sys-color-outline)',
                                    background: 'var(--md-sys-color-surface-container)',
                                    color: 'var(--md-sys-color-on-surface)',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                            >
                                <option value="">Select a skill...</option>
                                {AVAILABLE_SKILLS.map(skill => (
                                    <option key={skill} value={skill}>{skill}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Or Enter Custom Skill</label>
                            <input
                                type="text"
                                value={customSkill}
                                onChange={(e) => {
                                    setCustomSkill(e.target.value);
                                    if (e.target.value) setSelectedSkill("");
                                }}
                                placeholder="e.g. GraphQL, Tailwind CSS, Rust..."
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: '1px solid var(--md-sys-color-outline)',
                                    background: 'var(--md-sys-color-surface-container)',
                                    color: 'var(--md-sys-color-on-surface)',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <Button
                                type="button"
                                variant="glass"
                                onClick={() => router.back()}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="filled"
                                disabled={(!selectedSkill && !customSkill.trim()) || loading}
                            >
                                {loading ? 'Adding...' : 'Add Skill'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </ScrollReveal>
        </main>
    );
}
