"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PREDEFINED_TECHNOLOGIES = [
    "JavaScript", "TypeScript", "React", "Next.js", "Node.js",
    "Python", "Django", "Flask", "FastAPI",
    "Java", "Spring Boot", "Kotlin", "Android",
    "C++", "C", "C#", ".NET",
    "Go", "Rust", "Swift", "iOS",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis",
    "Docker", "Kubernetes", "AWS", "GCP", "Azure",
    "Machine Learning", "TensorFlow", "PyTorch", "OpenCV",
    "HTML", "CSS", "Tailwind CSS", "Bootstrap",
    "Git", "GitHub", "GitLab", "CI/CD",
    "Figma", "UI/UX"
].sort();

export default function AddProjectPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        technologies: [] as string[],
        link: "",
        features: ""
    });
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [techSearch, setTechSearch] = useState("");

    const toggleTech = (tech: string) => {
        const normalized = tech.trim();
        if (!normalized) return;

        const isSelected = formData.technologies.some(t => t.toLowerCase() === normalized.toLowerCase());
        const newTechs = isSelected
            ? formData.technologies.filter(t => t.toLowerCase() !== normalized.toLowerCase())
            : [...formData.technologies, normalized];

        setFormData({ ...formData, technologies: newTechs });
    };

    const filteredSuggestions = PREDEFINED_TECHNOLOGIES.filter(t =>
        t.toLowerCase().includes(techSearch.toLowerCase()) &&
        !formData.technologies.some(selected => selected.toLowerCase() === t.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            const res = await fetch('http://127.0.0.1:8000/student/projects', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: "",  // Will be set by backend
                    title: formData.title,
                    description: formData.description,
                    project_link: formData.link || null,
                    technologies: formData.technologies,
                    features: formData.features
                        ? formData.features.split(',').map(f => f.trim()).filter(f => f)
                        : []
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.ai_verified) {
                    setAnalyzing(false);
                }
                router.push('/dashboard');
            } else {
                console.error("Failed to add project");
            }
        } catch (error) {
            console.error("Error adding project:", error);
        } finally {
            setLoading(false);
            setAnalyzing(false);
        }
    };

    return (
        <main style={{ padding: '2rem 24px', maxWidth: '800px', margin: '0 auto', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
            <ScrollReveal width="100%">
                <Card variant="elevated" style={{ padding: '2.5rem' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Add New Project</h1>
                    <p style={{ color: 'var(--md-sys-color-secondary)', marginBottom: '2rem' }}>
                        Showcase your best work to recruiters and faculty.
                    </p>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Project Title</label>
                            <input
                                type="text"
                                placeholder="e.g. AI-Powered Traffic System"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                style={{
                                    width: '100%', padding: '1rem', borderRadius: '12px',
                                    border: '1px solid var(--md-sys-color-outline)',
                                    background: 'var(--md-sys-color-surface-container)',
                                    color: 'var(--md-sys-color-on-surface)', outline: 'none'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Description</label>
                            <textarea
                                placeholder="Briefly describe what you built..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                                rows={4}
                                style={{
                                    width: '100%', padding: '1rem', borderRadius: '12px',
                                    border: '1px solid var(--md-sys-color-outline)',
                                    background: 'var(--md-sys-color-surface-container)',
                                    color: 'var(--md-sys-color-on-surface)', outline: 'none', resize: 'vertical'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                Technologies
                            </label>

                            {/* Chip Selection UI */}
                            <div style={{
                                background: 'var(--md-sys-color-surface-container)',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                border: '1px solid var(--md-sys-color-outline)'
                            }}>
                                {/* Selected Chips */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1.5rem' }}>
                                    <AnimatePresence>
                                        {formData.technologies.map(tech => (
                                            <motion.div
                                                key={tech}
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.8, opacity: 0 }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    padding: '6px 12px', borderRadius: '8px',
                                                    background: 'rgba(168, 85, 247, 0.15)',
                                                    color: '#d8b4fe', border: '1px solid rgba(168, 85, 247, 0.3)',
                                                    fontSize: '0.9rem', userSelect: 'none'
                                                }}
                                            >
                                                {tech}
                                                <span
                                                    onClick={() => toggleTech(tech)}
                                                    style={{ cursor: 'pointer', opacity: 0.7, fontWeight: 'bold', fontSize: '1.1rem', marginLeft: '4px' }}
                                                >
                                                    ×
                                                </span>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    {formData.technologies.length === 0 && (
                                        <div style={{ color: 'var(--md-sys-color-secondary)', fontSize: '0.9rem', fontStyle: 'italic', padding: '0.5rem 0' }}>
                                            No technologies selected. Add some below.
                                        </div>
                                    )}
                                </div>

                                {/* Search Input */}
                                <div style={{
                                    display: 'flex', gap: '10px', alignItems: 'center',
                                    background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '8px',
                                    border: '1px solid var(--md-sys-color-outline)'
                                }}>
                                    <span style={{ opacity: 0.5 }}>🔍</span>
                                    <input
                                        type="text"
                                        value={techSearch}
                                        onChange={(e) => setTechSearch(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (techSearch.trim()) {
                                                    toggleTech(techSearch.trim());
                                                    setTechSearch('');
                                                }
                                            }
                                        }}
                                        placeholder="Search or add custom technology..."
                                        style={{
                                            flex: 1, background: 'transparent', border: 'none', outline: 'none',
                                            color: 'var(--md-sys-color-on-surface)', fontSize: '0.95rem'
                                        }}
                                    />
                                    {techSearch.trim() && (
                                        <Button
                                            type="button"
                                            variant="text"
                                            onClick={() => { toggleTech(techSearch.trim()); setTechSearch(''); }}
                                            style={{ padding: '4px 8px', fontSize: '0.8rem', height: 'auto' }}
                                        >
                                            Add
                                        </Button>
                                    )}
                                </div>

                                {/* Suggestions */}
                                <div style={{ marginTop: '1rem' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-secondary)', marginBottom: '0.5rem' }}>
                                        Suggestions
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                                        {filteredSuggestions.slice(0, 15).map(tech => (
                                            <motion.div
                                                key={tech}
                                                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => toggleTech(tech)}
                                                style={{
                                                    padding: '6px 12px', borderRadius: '6px',
                                                    background: 'rgba(255,255,255,0.05)', cursor: 'pointer',
                                                    fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface-variant)',
                                                    border: '1px solid rgba(255,255,255,0.1)'
                                                }}
                                            >
                                                + {tech}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>GitHub Repository Link</label>
                            <input
                                type="url"
                                placeholder="https://github.com/username/repo"
                                value={formData.link}
                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                required
                                style={{
                                    width: '100%', padding: '1rem', borderRadius: '12px',
                                    border: '1px solid var(--md-sys-color-outline)',
                                    background: 'var(--md-sys-color-surface-container)',
                                    color: 'var(--md-sys-color-on-surface)', outline: 'none'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Key Features (comma separated)</label>
                            <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-secondary)', marginBottom: '0.5rem' }}>
                                List features you implemented — AI will verify them against your repo.
                            </p>
                            <input
                                type="text"
                                placeholder="e.g. JWT Authentication, CRUD operations, Email notifications"
                                value={formData.features}
                                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                                style={{
                                    width: '100%', padding: '1rem', borderRadius: '12px',
                                    border: '1px solid var(--md-sys-color-outline)',
                                    background: 'var(--md-sys-color-surface-container)',
                                    color: 'var(--md-sys-color-on-surface)', outline: 'none'
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
                                disabled={!formData.title || !formData.description || formData.technologies.length === 0 || !formData.link || loading}
                            >
                                {loading ? '🤖 Analyzing & Adding...' : 'Add Project'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </ScrollReveal>
        </main>
    );
}
