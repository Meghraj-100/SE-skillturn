"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useAuth } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { StudentSkillModal } from "@/components/StudentSkillModal";
import { ResumeModal } from "@/components/ResumeModal";

interface Skill {
    id: string;
    name: string;
    verified: boolean;
    verification_status?: string;
}

interface Project {
    id: string;
    title: string;
    description: string;
    verified: boolean;
    verification_status?: string;
    technologies: string[];
    project_link?: string;
    // AI Verification
    ai_verified?: boolean;
    ai_score?: number;
    ai_breakdown?: {
        functionality: number;
        code_quality: number;
        project_structure: number;
        responsiveness: number;
        documentation: number;
    };
    ai_feature_results?: Array<{
        feature: string;
        implemented: boolean;
        confidence: number;
        remarks: string;
    }>;
    verified_by_name?: string;
}

export default function DashboardPage() {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const { user } = useAuth();
    const [appliedOpportunities, setAppliedOpportunities] = useState<any[]>([]);
    const [pastOpportunities, setPastOpportunities] = useState<any[]>([]);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
    const [profile, setProfile] = useState<any>(null);

    // Mock JSON Data simulating API response (skills/projects handled by real endpoints above)
    const mockApiResponse = {
        skills: [
            { id: 's1', name: 'React', verified: true },
            { id: 's2', name: 'TypeScript', verified: true },
            { id: 's3', name: 'Node.js', verified: false },
            { id: 's4', name: 'Python', verified: true },
            { id: 's5', name: 'Machine Learning', verified: false },
        ],
        projects: [
            {
                id: 'p1',
                title: 'E-Commerce Platform',
                description: 'A full-stack e-commerce application with payment gateway integration.',
                verified: true,
                technologies: ['React', 'Node.js', 'Stripe']
            },
            {
                id: 'p2',
                title: 'Portfolio Website',
                description: 'Personal portfolio website to showcase skills and projects.',
                verified: false,
                technologies: ['Next.js', 'Tailwind CSS']
            }
        ]
    };

    // Simulate API Call

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                setLoading(true);
                try {
                    const res = await fetch('http://127.0.0.1:8000/student/full-profile', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        // Map Skills
                        const mappedSkills = data.skills.map((s: any) => ({
                            id: s.id,
                            name: s.name,
                            verified: s.verification_status === 'Verified' || s.verification_status === 'Approved',
                            verification_status: s.verification_status === 'Approved' ? 'Verified' : s.verification_status
                        }));
                        setSkills(mappedSkills);

                        // Map Projects
                        const mappedProjects = data.projects.map((p: any) => ({
                            id: p.id,
                            title: p.title,
                            description: p.description,
                            verified: p.is_verified || p.verification_status === 'Verified' || p.verification_status === 'Approved',
                            verification_status: (p.verification_status === 'Approved' ? 'Verified' : p.verification_status) || (p.is_verified ? 'Verified' : 'Pending'),
                            technologies: p.technologies || [],
                            project_link: p.project_link || '',
                            ai_verified: p.ai_verified || false,
                            ai_score: p.ai_score,
                            ai_breakdown: p.ai_breakdown,
                            ai_feature_results: p.ai_feature_results || [],
                            verified_by_name: p.verified_by_name
                        }));
                        setProjects(mappedProjects);
                    }

                    // Fetch Full Profile
                    const profileResp = await fetch('http://127.0.0.1:8000/student/profile', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (profileResp.ok) {
                        const data = await profileResp.json();
                        setProfile(data);
                    }

                    // Fetch real applications from backend
                    const appsResp = await fetch('http://127.0.0.1:8000/student/applications', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (appsResp.ok) {
                        const apps = await appsResp.json();
                        const active = apps.filter((a: any) => ['Applied', 'Shortlisted', 'Screening', 'Interview', 'Offer'].includes(a.status));
                        const past = apps.filter((a: any) => ['Rejected', 'Selected', 'Completed'].includes(a.status));
                        setAppliedOpportunities(active);
                        setPastOpportunities(past);
                    }
                } catch (error) {
                    console.error("Failed to fetch dashboard data:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchData();
    }, []);

    const updateSkills = async (newSkillNames: string[]) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const currentNames = skills.map(s => s.name);
        const toAdd = newSkillNames.filter(n => !currentNames.includes(n));

        for (const name of toAdd) {
            try {
                const res = await fetch('http://127.0.0.1:8000/student/skills', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name })
                });

                if (res.ok) {
                    // Update local state optimistically or refetch
                    const saved = await res.json();
                    // The response is the full StudentSkills object or just the new skill?
                    // My endpoint returns StudentSkills object (list of all skills).
                    const newSkillList = saved.skills.map((s: any) => ({
                        id: s.id,
                        name: s.name,
                        verified: s.verification_status === 'Verified',
                        verification_status: s.verification_status
                    }));
                    setSkills(newSkillList);
                }
            } catch (e) {
                console.error("Failed to add skill", name, e);
            }
        }
    };

    if (loading) {
        return (
            <main style={{ padding: '2rem 24px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        border: '4px solid var(--md-sys-color-surface-variant)',
                        borderTop: '4px solid var(--md-sys-color-primary)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem'
                    }}>
                        <style dangerouslySetInnerHTML={{
                            __html: `
                            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        `}} />
                    </div>
                    <p style={{ color: 'var(--md-sys-color-secondary)' }}>Loading your dashboard...</p>
                </div>
            </main>
        );
    }

    return (
        <main style={{ padding: '2rem 24px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}>
            <ScrollReveal width="100%">
                <header style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {/* User Avatar */}
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--md-sys-color-primary), var(--md-sys-color-tertiary))',
                        color: 'var(--md-sys-color-on-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}>
                        {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'S'}
                    </div>

                    <div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                            Welcome, {user?.full_name?.split(' ')[0] || 'Student'}!
                        </h1>
                        <p style={{ fontSize: '1.1rem', color: 'var(--md-sys-color-secondary)' }}>
                            Here's an overview of your profile and applications.
                        </p>
                    </div>

                    <div style={{ marginLeft: 'auto' }}>
                        <Button
                            variant="filled"
                            style={{
                                background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                                padding: '12px 24px',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                boxShadow: '0 10px 25px rgba(126, 34, 206, 0.3)'
                            }}
                            onClick={() => setIsResumeModalOpen(true)}
                        >
                            <span>✨ View AI Resume</span>
                        </Button>
                    </div>
                </header>
            </ScrollReveal>

            {/* Skills & Projects Section - Full Width */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', marginBottom: '4rem' }}>

                {/* Skills Section */}
                <ScrollReveal width="100%" delay={0.1}>
                    <section>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                                <span style={{ width: '6px', height: '24px', background: 'var(--md-sys-color-tertiary)', borderRadius: '3px' }}></span>
                                My Skills
                            </h2>
                            <Button
                                variant="outlined"
                                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                                onClick={() => setIsSkillModalOpen(true)}
                            >
                                + Add New Skill
                            </Button>
                        </div>
                        <Card variant="outlined" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                {skills.map(skill => (
                                    <div
                                        key={skill.id}
                                        title={skill.verification_status || "Pending"}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '1rem',
                                            fontWeight: 500,
                                            background: skill.verification_status === 'Verified' ? 'rgba(76, 175, 80, 0.1)' : skill.verification_status === 'Rejected' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(255, 193, 7, 0.1)',
                                            border: `1px solid ${skill.verification_status === 'Verified' ? '#4CAF50' : skill.verification_status === 'Rejected' ? '#F44336' : '#FFC107'}`,
                                            color: 'var(--md-sys-color-on-surface)'
                                        }}
                                    >
                                        {skill.name}
                                        {skill.verification_status === 'Verified' ? (
                                            <span style={{ color: '#4CAF50', fontSize: '1.1rem' }}>✓</span>
                                        ) : skill.verification_status === 'Rejected' ? (
                                            <span style={{ color: '#F44336', fontSize: '1.1rem' }}>✕</span>
                                        ) : (
                                            <span style={{ color: '#FFC107', fontSize: '1.1rem' }}>●</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </section>
                </ScrollReveal>

                {/* Projects Section */}
                <ScrollReveal width="100%" delay={0.2}>
                    <section>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                                <span style={{ width: '6px', height: '24px', background: 'var(--md-sys-color-secondary)', borderRadius: '3px' }}></span>
                                My Projects
                            </h2>
                            <Link href="/add-project">
                                <Button variant="outlined" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>+ Add New Project</Button>
                            </Link>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                            {projects.map(project => (
                                <Card key={project.id} variant="elevated" style={{ padding: '1.5rem', position: 'relative' }}>
                                    {/* Dual Verification Badges */}
                                    <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {/* Faculty Badge */}
                                        <span
                                            title={`Faculty: ${project.verification_status || 'Pending'}`}
                                            style={{
                                                fontSize: '0.75rem',
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                fontWeight: 600,
                                                background: project.verification_status === 'Verified' ? 'rgba(76, 175, 80, 0.1)' : project.verification_status === 'Rejected' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(255, 193, 7, 0.1)',
                                                border: `1px solid ${project.verification_status === 'Verified' ? '#4CAF50' : project.verification_status === 'Rejected' ? '#F44336' : '#FFC107'}`,
                                                color: project.verification_status === 'Verified' ? '#2E7D32' : project.verification_status === 'Rejected' ? '#C62828' : '#F57F17'
                                            }}
                                        >
                                            🎓 {project.verified_by_name === 'AI_SYSTEM' ? 'Auto-Verified' : (project.verification_status || 'Pending')}
                                        </span>
                                        {/* AI Badge */}
                                        {project.ai_verified ? (
                                            <span
                                                title={`AI Score: ${project.ai_score}%`}
                                                style={{
                                                    fontSize: '0.75rem',
                                                    padding: '4px 10px',
                                                    borderRadius: '8px',
                                                    fontWeight: 600,
                                                    background: (project.ai_score || 0) >= 75 ? 'rgba(76, 175, 80, 0.1)' : (project.ai_score || 0) >= 50 ? 'rgba(255, 152, 0, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                                                    border: `1px solid ${(project.ai_score || 0) >= 75 ? '#4CAF50' : (project.ai_score || 0) >= 50 ? '#FF9800' : '#F44336'}`,
                                                    color: (project.ai_score || 0) >= 75 ? '#2E7D32' : (project.ai_score || 0) >= 50 ? '#E65100' : '#C62828'
                                                }}
                                            >
                                                🤖 AI: {project.ai_score}%
                                            </span>
                                        ) : (
                                            <span
                                                style={{
                                                    fontSize: '0.75rem',
                                                    padding: '4px 10px',
                                                    borderRadius: '8px',
                                                    fontWeight: 600,
                                                    background: 'rgba(158, 158, 158, 0.1)',
                                                    border: '1px solid #9E9E9E',
                                                    color: '#757575'
                                                }}
                                            >
                                                🤖 Not Analyzed
                                            </span>
                                        )}
                                    </div>

                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', paddingRight: '12rem' }}>{project.title}</h3>
                                    <p style={{ fontSize: '1rem', color: 'var(--md-sys-color-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
                                        {project.description}
                                    </p>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                        {project.technologies.map(tech => (
                                            <span key={tech} style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', background: 'var(--md-sys-color-surface-variant)', padding: '4px 10px', borderRadius: '6px' }}>
                                                {tech}
                                            </span>
                                        ))}
                                    </div>

                                    {/* AI Feature Results Breakdown */}
                                    {project.ai_feature_results && project.ai_feature_results.length > 0 && (
                                        <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                                            <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--md-sys-color-on-surface)' }}>📊 AI Feature Analysis</p>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
                                                {project.ai_feature_results.map((fr, idx) => (
                                                    <div key={idx} style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        fontSize: '0.8rem',
                                                        padding: '6px 10px',
                                                        borderRadius: '8px',
                                                        background: fr.implemented ? 'rgba(76, 175, 80, 0.05)' : 'rgba(244, 67, 54, 0.05)',
                                                        border: `1px solid ${fr.implemented ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'}`
                                                    }}>
                                                        <span>{fr.implemented ? '✅' : '❌'}</span>
                                                        <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fr.feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Project Quality Scores Breakdown */}
                                    {project.ai_breakdown && (
                                        <div style={{ background: 'var(--md-sys-color-surface-container-low)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--md-sys-color-on-surface)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    📈 Quality Breakdown
                                                </p>
                                                <div style={{
                                                    background: (project.ai_score || 0) > 70 ? 'rgba(76, 175, 80, 0.2)' : (project.ai_score || 0) > 40 ? 'rgba(255, 152, 0, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                                                    padding: '4px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 800,
                                                    color: (project.ai_score || 0) > 70 ? '#2E7D32' : (project.ai_score || 0) > 40 ? '#E65100' : '#C62828',
                                                    border: `1px solid ${(project.ai_score || 0) > 70 ? '#4CAF50' : (project.ai_score || 0) > 40 ? '#FF9800' : '#F44336'}`
                                                }}>
                                                    Overall: {project.ai_score}%
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                                                {[
                                                    { label: 'Functionality', val: project.ai_breakdown.functionality, icon: '⚙️' },
                                                    { label: 'Code Quality', val: project.ai_breakdown.code_quality, icon: '💎' },
                                                    { label: 'Structure', val: project.ai_breakdown.project_structure, icon: '📁' },
                                                    { label: 'Responsive', val: project.ai_breakdown.responsiveness, icon: '📱' },
                                                    { label: 'Docs', val: project.ai_breakdown.documentation, icon: '📄' }
                                                ].map((item, i) => (
                                                    <div key={i}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
                                                            <span>{item.icon} {item.label}</span>
                                                            <span style={{ fontWeight: 600 }}>{item.val}%</span>
                                                        </div>
                                                        <div style={{ height: '4px', background: 'var(--md-sys-color-outline-variant)', borderRadius: '2px', overflow: 'hidden' }}>
                                                            <div style={{
                                                                width: `${item.val}%`,
                                                                height: '100%',
                                                                background: item.val > 70 ? '#4CAF50' : item.val > 40 ? '#FF9800' : '#F44336',
                                                                borderRadius: '2px'
                                                            }}></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Project Link */}
                                    {project.project_link && (
                                        <a href={project.project_link} target="_blank" rel="noopener noreferrer" style={{
                                            display: 'inline-block', marginTop: '0.75rem', fontSize: '0.85rem',
                                            color: 'var(--md-sys-color-primary)', textDecoration: 'none'
                                        }}>
                                            🔗 View on GitHub
                                        </a>
                                    )}
                                </Card>
                            ))}
                        </div>
                    </section>
                </ScrollReveal>
            </div>

            <ScrollReveal width="100%" delay={0.3}>
                <section style={{ marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ width: '8px', height: '32px', background: 'var(--md-sys-color-primary)', borderRadius: '4px' }}></span>
                        Active Applications
                    </h2>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        {appliedOpportunities.map(opp => (
                            <motion.div
                                layoutId={`dashboard-${opp.id}`}
                                key={opp.id}
                                onClick={() => setSelectedId(`dashboard-${opp.id}`)}
                                style={{ cursor: 'pointer' }}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                <Card variant="elevated" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', pointerEvents: 'none' }}>
                                    <div>
                                        <motion.h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{opp.title}</motion.h3>
                                        <motion.p style={{ color: 'var(--md-sys-color-secondary)' }}>{opp.organization}</motion.p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ display: 'block', fontSize: '0.875rem', color: 'var(--md-sys-color-secondary)' }}>Status</span>
                                            <span style={{
                                                fontWeight: 600,
                                                color: (opp.status === 'Shortlisted' || opp.status === 'Selected' || opp.status === 'Offer')
                                                    ? '#4CAF50'
                                                    : (opp.status === 'Screening' || opp.status === 'Interview')
                                                        ? 'var(--md-sys-color-tertiary)'
                                                        : 'var(--md-sys-color-primary)'
                                            }}>
                                                {opp.status}
                                            </span>
                                        </div>
                                        <Button variant="glass" style={{ pointerEvents: 'auto' }}>View Status</Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </ScrollReveal>

            <ScrollReveal width="100%" delay={0.4}>
                <section>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ width: '8px', height: '32px', background: 'var(--md-sys-color-secondary)', borderRadius: '4px' }}></span>
                        Past Opportunities
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                        {pastOpportunities.map(opp => (
                            <motion.div
                                layoutId={`past-${opp.id}`}
                                key={opp.id}
                                onClick={() => setSelectedId(`past-${opp.id}`)}
                                style={{ cursor: 'pointer', height: '100%' }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Card variant="elevated" style={{ height: '100%', pointerEvents: 'none', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{
                                        position: 'absolute', top: 0, right: 0, padding: '4px 12px',
                                        background: (opp.status === 'Completed' || opp.status === 'Selected') ? '#E8F5E9' : opp.status === 'Rejected' ? '#FFEBEE' : '#F3F4F6',
                                        color: (opp.status === 'Completed' || opp.status === 'Selected') ? '#2E7D32' : opp.status === 'Rejected' ? '#C62828' : '#374151',
                                        borderBottomLeftRadius: '12px', fontSize: '0.8rem', fontWeight: 600
                                    }}>
                                        {opp.status}
                                    </div>
                                    <motion.h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', paddingRight: '2rem' }}>{opp.title}</motion.h3>
                                    <motion.p style={{ color: 'var(--md-sys-color-secondary)', marginBottom: '1rem' }}>{opp.organization}</motion.p>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                        <Button variant="glass" style={{ pointerEvents: 'auto', width: '100%' }}>View Details</Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </ScrollReveal>

            <AnimatePresence>
                {selectedId && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedId(null)}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0,0,0,0.6)',
                                backdropFilter: 'blur(4px)',
                                zIndex: 40
                            }}
                        />
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 50,
                            pointerEvents: 'none'
                        }}>
                            {/* Find the opportunity from either list */}
                            {[...appliedOpportunities, ...pastOpportunities].filter(item =>
                                `dashboard-${item.id}` === selectedId || `past-${item.id}` === selectedId
                            ).map(opp => (
                                <motion.div
                                    layoutId={selectedId}
                                    key={opp.id}
                                    style={{
                                        width: '90%',
                                        maxWidth: '700px',
                                        maxHeight: '85vh',
                                        overflowY: 'auto',
                                        background: 'var(--md-sys-color-surface)',
                                        borderRadius: '24px',
                                        padding: '2rem',
                                        pointerEvents: 'auto',
                                        position: 'relative',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                                    }}
                                >
                                    <Button
                                        variant="glass"
                                        onClick={() => setSelectedId(null)}
                                        style={{
                                            position: 'absolute',
                                            top: '1rem',
                                            right: '1rem',
                                            minWidth: 'auto',
                                            padding: '8px',
                                            borderRadius: '50%',
                                            width: '36px',
                                            height: '36px'
                                        }}
                                    >
                                        ✕
                                    </Button>

                                    <span style={{
                                        display: 'inline-block',
                                        padding: '4px 12px',
                                        borderRadius: '16px',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        backgroundColor: opp.type === 'Internship' ? 'var(--md-sys-color-tertiary-container)' : 'var(--md-sys-color-primary-container)',
                                        color: opp.type === 'Internship' ? 'var(--md-sys-color-on-tertiary-container)' : 'var(--md-sys-color-on-primary-container)',
                                        marginBottom: '1rem'
                                    }}>
                                        {opp.type}
                                    </span>

                                    <motion.h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--md-sys-color-on-surface)' }}>{opp.title}</motion.h2>
                                    <motion.p style={{ fontSize: '1.1rem', color: 'var(--md-sys-color-secondary)', marginBottom: '2rem', fontWeight: 500 }}>
                                        {opp.organization}
                                    </motion.p>

                                    {/* Status Section for Applied Opps */}
                                    {selectedId.startsWith('dashboard') && (
                                        <div style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--md-sys-color-surface-variant)', borderRadius: '12px' }}>
                                            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', fontWeight: 600 }}>Application Status</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: opp.status === 'Shortlisted' ? '#4CAF50' : 'var(--md-sys-color-primary)' }}></div>
                                                <span style={{ fontWeight: 600, color: opp.status === 'Shortlisted' ? '#4CAF50' : 'inherit' }}>{opp.status}</span>
                                                <span style={{ color: 'var(--md-sys-color-secondary)', fontSize: '0.9rem' }}>- Submitted on {new Date(opp.submittedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Status Section for Past Opps */}
                                    {selectedId.startsWith('past') && (
                                        <div style={{
                                            marginBottom: '2rem',
                                            padding: '1rem',
                                            background: (opp.status === 'Completed' || opp.status === 'Selected') ? '#E8F5E9' : opp.status === 'Rejected' ? '#FFEBEE' : '#F3F4F6',
                                            borderRadius: '12px'
                                        }}>
                                            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', fontWeight: 600 }}>Outcome</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span style={{
                                                    fontWeight: 600,
                                                    color: (opp.status === 'Completed' || opp.status === 'Selected' || opp.status === 'Offer' || opp.status === 'Shortlisted')
                                                        ? '#2E7D32'
                                                        : (opp.status === 'Screening' || opp.status === 'Interview')
                                                            ? 'var(--md-sys-color-tertiary)'
                                                            : opp.status === 'Rejected' ? '#C62828' : '#374151'
                                                }}>
                                                    {opp.status}
                                                </span>
                                                <span style={{ color: 'var(--md-sys-color-secondary)', fontSize: '0.9rem' }}>- Closed on {new Date(opp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    )}

                                    <motion.div style={{ marginBottom: '2rem' }}>
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 600 }}>Description</h3>
                                        <p style={{ lineHeight: 1.7, color: 'var(--md-sys-color-on-surface-variant)' }}>
                                            {opp.description}
                                        </p>
                                    </motion.div>

                                    <div style={{ marginBottom: '2rem' }}>
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 600 }}>Required Skills</h3>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {opp.skills.map((skill: string) => (
                                                <span key={skill} style={{
                                                    fontSize: '0.9rem',
                                                    padding: '4px 12px',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--md-sys-color-outline, #79747E)',
                                                    color: 'var(--md-sys-color-on-surface-variant)'
                                                }}>
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}
            </AnimatePresence>

            <StudentSkillModal
                isOpen={isSkillModalOpen}
                onClose={() => setIsSkillModalOpen(false)}
                currentSkills={skills.map(s => s.name)}
                onUpdate={updateSkills}
            />

            {profile && (
                <ResumeModal
                    isOpen={isResumeModalOpen}
                    onClose={() => setIsResumeModalOpen(false)}
                    data={{
                        name: user?.full_name || 'Student',
                        email: user?.email || '',
                        college: profile.college || 'University',
                        degree: profile.degree || 'B.Tech',
                        branch: profile.branch || 'CSE',
                        skills: skills.map(s => s.name),
                        projects: projects.filter(p => p.verified).map(p => ({ title: p.title, description: p.description }))
                    }}
                />
            )}
        </main>
    );
}
