"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { GlassContainer } from "@/components/ui/GlassContainer";
import { JobFormModal, JobData } from "@/components/JobFormModal";
import styles from './dashboard.module.css';
import ScrollReveal from "@/components/ui/ScrollReveal";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";

// --- Mock Data Interfaces ---

interface JobPosition {
    id: string;
    title: string;
    department: string;
    location: string;
    type: 'Full-time' | 'Internship' | 'Contract';
    postedString: string;
    applicantsCount: number;
    status: 'Active' | 'Closed' | 'Draft';
    skills?: string[];
}

interface Candidate {
    id: string;
    name: string;
    email: string;
    appliedRole: string; // Linking to JobPosition.title or ID
    status: 'New' | 'Screening' | 'Interview' | 'Offer' | 'Rejected' | 'Selected';
    institution: string;
    program: string;
    branch: string;
    skills: string[];
    resumeLink: string;
    matchScore: number; // 0-100
    appliedDate: string;
    avatarInitials: string;
}

// --- Initial Mock Data ---

const INITIAL_JOBS: JobPosition[] = []; // Fetched from API
const INITIAL_CANDIDATES: Candidate[] = []; // Fetched from API

import { useRouter } from 'next/navigation';

export default function RecruiterDashboardPage() {
    const router = useRouter();

    const [jobs, setJobs] = useState<JobPosition[]>(INITIAL_JOBS);
    const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<'All' | 'New' | 'Screening' | 'Interview' | 'Selected'>('All');
    const [selectedJobFilter, setSelectedJobFilter] = useState<string | null>(null); // null means 'All Interns'
    const [selectedJobDetail, setSelectedJobDetail] = useState<JobPosition | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [recruiterName, setRecruiterName] = useState("Recruiter");
    const [companyName, setCompanyName] = useState("Company");

    // --- Fetch Real Data ---
    const fetchDashboardData = async (isInitial = false) => {
        if (isInitial) setIsLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:8000/recruiter/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();

                // Map backend opportunities to JobPosition (or use data.jobs directly if format matches)
                const dbJobs: JobPosition[] = data.jobs.map((j: any) => ({
                    id: j.id,
                    title: j.title,
                    department: j.department || j.organization,
                    location: j.location,
                    type: j.type as any,
                    postedString: j.postedString || new Date().toLocaleDateString(),
                    applicantsCount: j.applicantsCount || 0,
                    status: j.status || 'Active',
                    skills: j.skills || []
                }));

                setJobs(dbJobs);
                setCandidates(data.candidates);
                setRecruiterName(data.recruiterName || "Recruiter");
                setCompanyName(data.companyName || "Company");
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            if (isInitial) setIsLoading(false);
        }
    };

    // Fetch Dashboard Data
    useEffect(() => {
        fetchDashboardData(true);
    }, [router]);

    // --- Derived Stats ---
    const totalApplications = candidates.length;
    const interviewsScheduled = candidates.filter(c => c.status === 'Interview').length;
    const activePositions = jobs.filter(j => j.status === 'Active').length;
    const selectedStudents = candidates.filter(c => c.status === 'Selected').length;

    // --- Filter Logic ---
    const filteredCandidates = candidates.filter(c => {
        const matchesStatus = filterStatus === 'All' ? c.status !== 'Rejected' : c.status === filterStatus;
        const matchesJob = selectedJobFilter === null || c.appliedRole === selectedJobFilter;
        return matchesStatus && matchesJob;
    });

    const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);

    const handleStatusUpdate = async (id: string, newStatus: Candidate['status']) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`http://127.0.0.1:8000/recruiter/applications/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
            }
        } catch (e) {
            console.error("Failed to update status", e);
        }
    };

    const [showJobModal, setShowJobModal] = useState(false);

    const handleJobSubmit = async (data: JobData) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            // Map tenure to a valid backend type
            const tenureMap: Record<string, string> = {
                'full-time': 'Job', 'fulltime': 'Job', 'job': 'Job', 'contract': 'Job',
                'internship': 'Internship', 'intern': 'Internship',
                'project': 'Project', 'freelance': 'Project'
            };
            const mappedType = tenureMap[data.tenure.toLowerCase().trim()] || 'Internship';

            const res = await fetch('http://127.0.0.1:8000/recruiter/opportunities', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: data.position,
                    type: mappedType,
                    organization: data.company, // Required by backend
                    description: data.description,
                    skills: data.skills || [],
                    location: data.location,
                    salary: data.salary,
                    deadline: "2026-12-31"
                })
            });

            if (res.ok) {
                const newOpp = await res.json();
                setJobs(prev => [...prev, {
                    id: newOpp.id || newOpp._id,
                    title: newOpp.title,
                    department: newOpp.organization,
                    location: newOpp.location,
                    type: newOpp.type as any,
                    postedString: 'Just now',
                    applicantsCount: 0,
                    status: 'Active'
                }]);
                setShowJobModal(false);
                alert("✅ Opportunity Posted Successfully!");
            } else {
                const errData = await res.json().catch(() => null);
                const detail = errData?.detail || `Server error (${res.status})`;
                alert(`❌ Failed to post: ${detail}`);
            }
        } catch (e) {
            console.error("Failed to post opportunity", e);
            alert("❌ Network error — could not reach the server.");
        }
    };

    const handleDeleteJob = async (jobId: string) => {
        if (!confirm("Are you sure you want to delete this opportunity? This action cannot be undone.")) {
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`http://127.0.0.1:8000/opportunities/${jobId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                setJobs(prev => prev.filter(j => j.id !== jobId));
                if (selectedJobFilter === jobs.find(j => j.id === jobId)?.title) {
                    setSelectedJobFilter(null);
                }
                alert("✅ Opportunity deleted successfully.");
            } else {
                const err = await res.json().catch(() => ({ detail: "Unknown error" }));
                alert(`❌ Failed to delete: ${err.detail || "Server error"}`);
            }
        } catch (e) {
            console.error("Error deleting job:", e);
            alert("❌ Network error.");
        }
    };

    return (
        <main style={{ padding: '2rem 24px', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh' }}>

            {/* Header Section */}
            <header className={styles.headerContainer}>
                <div className={styles.profileSection} style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '24px',
                        background: 'linear-gradient(135deg, var(--md-sys-color-primary), var(--md-sys-color-secondary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '2rem', fontWeight: 'bold', boxShadow: '0 10px 30px -10px var(--md-sys-color-primary)'
                    }}>
                        {recruiterName.charAt(0)}
                    </div>
                    <div>
                        <h1 style={{ fontWeight: 'bold', fontSize: '2rem', lineHeight: '1.2' }}>{recruiterName}</h1>
                        <p style={{ fontSize: '1rem', color: 'var(--md-sys-color-primary)', fontWeight: 500 }}>Global Talent Acquisition Lead</p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-secondary)' }}>{companyName}</p>
                    </div>
                </div>

                <div className={styles.rightContentWrapper}>
                    <div className={styles.titleSection}>
                        <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>Recruiter Dashboard</h2>
                        <p style={{ fontSize: '1.0rem', color: 'var(--md-sys-color-secondary)', margin: 0 }}>
                            Monday, October 24, 2026
                        </p>
                    </div>
                    <div className={styles.actionButtonWrapper} style={{ display: 'flex', gap: '1rem' }}>
                        <Button variant="outlined" style={{ marginTop: '0.5rem' }} onClick={() => router.push('/studentProfiles')}>Search Candidates</Button>
                        <Button variant="filled" style={{ marginTop: '0.5rem' }} onClick={() => setShowJobModal(true)}>+ Post New Intern</Button>
                    </div>
                </div>
            </header>

            {/* Stats Cards */}
            <ScrollReveal width="100%" delay={0.1}>
                <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    <Card variant="elevated">
                        <h3 style={{ fontSize: '1rem', color: 'var(--md-sys-color-secondary)', marginBottom: '0.5rem' }}>Total Applications</h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--md-sys-color-on-surface)' }}>{totalApplications}</div>
                        <div style={{ fontSize: '0.85rem', color: 'green', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>▲ 12%</span> <span style={{ color: 'var(--md-sys-color-secondary)' }}>vs last week</span>
                        </div>
                    </Card>
                    <Card variant="elevated">
                        <h3 style={{ fontSize: '1rem', color: 'var(--md-sys-color-secondary)', marginBottom: '0.5rem' }}>Interviews Scheduled</h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--md-sys-color-tertiary)' }}>{interviewsScheduled}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-secondary)' }}>4 today</div>
                    </Card>
                    <Card variant="elevated">
                        <h3 style={{ fontSize: '1rem', color: 'var(--md-sys-color-secondary)', marginBottom: '0.5rem' }}>Active Positions</h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--md-sys-color-primary)' }}>{activePositions}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-secondary)' }}>Expiring in 5 days: 1</div>
                    </Card>
                    <Card variant="elevated">
                        <h3 style={{ fontSize: '1rem', color: 'var(--md-sys-color-secondary)', marginBottom: '0.5rem' }}>Selected Students</h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'green' }}>{selectedStudents}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-secondary)' }}>Hired this cycle</div>
                    </Card>
                </section>
            </ScrollReveal>

            <div className={styles.dashboardGrid}>

                {/* Left Column: Intern Positions */}
                <div className={styles.stickyColumn}>
                    <ScrollReveal width="100%" delay={0.2}>
                        <section>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Active Interns</h3>
                                <Link href="/r-posted_jobs" style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-primary)', cursor: 'pointer', textDecoration: 'none' }}>View All</Link>
                            </div>

                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {jobs.map(job => (
                                    <motion.div
                                        key={job.id}
                                        whileHover={{ y: -2 }}
                                        onClick={() => setSelectedJobFilter(job.title === selectedJobFilter ? null : job.title)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <GlassContainer style={{
                                            padding: '1.25rem',
                                            border: selectedJobFilter === job.title ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--glass-border)',
                                            background: selectedJobFilter === job.title ? 'rgba(var(--md-sys-color-primary-rgb), 0.05)' : 'var(--glass-background)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <h4 style={{ fontWeight: 'bold', fontSize: '1rem' }}>{job.title}</h4>
                                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: 'var(--md-sys-color-secondary-container)', color: 'var(--md-sys-color-on-secondary-container)' }}>
                                                    {job.type}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-secondary)', marginBottom: '1rem' }}>
                                                {job.department} • {job.location}
                                            </p>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--md-sys-color-secondary)' }}>
                                                <span>{job.applicantsCount} Applicants</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span>{job.postedString}</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteJob(job.id);
                                                        }}
                                                        style={{
                                                            background: 'none', border: 'none', cursor: 'pointer',
                                                            color: 'var(--md-sys-color-error)', opacity: 0.7,
                                                            padding: '4px', borderRadius: '4px',
                                                            transition: 'all 0.2s', fontSize: '1rem'
                                                        }}
                                                        title="Delete Opportunity"
                                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        </GlassContainer>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    </ScrollReveal>
                </div>

                {/* Right Column: Candidates & Actions */}
                <ScrollReveal width="100%" delay={0.3}>
                    <section>
                        {/* Filters */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                            {(['All', 'New', 'Screening', 'Interview', 'Selected'] as const).map(status => (
                                <div
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    style={{
                                        padding: '0.75rem 1.5rem', borderRadius: '100px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
                                        background: filterStatus === status ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-variant)',
                                        color: filterStatus === status ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface-variant)',
                                        transition: 'all 0.2s ease',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {status}
                                </div>
                            ))}
                        </div>

                        {/* Candidate List */}
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {filteredCandidates.length === 0 ? (
                                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--md-sys-color-secondary)', background: 'rgba(0,0,0,0.03)', borderRadius: '16px' }}>
                                    <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No candidates found</p>
                                    <p>Try adjusting your search or filters.</p>
                                </div>
                            ) : (
                                filteredCandidates.map(candidate => (
                                    <motion.div
                                        layoutId={`candidate-${candidate.id}`}
                                        key={candidate.id}
                                        onClick={() => setSelectedCandidateId(candidate.id)}
                                        style={{ cursor: 'pointer' }}
                                        whileHover={{ scale: 1.01 }}
                                    >
                                        <GlassContainer style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                                            {/* Avatar */}
                                            <div style={{
                                                width: '56px', height: '56px', borderRadius: '50%', background: 'var(--md-sys-color-tertiary-container)',
                                                color: 'var(--md-sys-color-on-tertiary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1.2rem', fontWeight: 'bold'
                                            }}>
                                                {candidate.avatarInitials}
                                            </div>

                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: '200px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.25rem' }}>
                                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{candidate.name}</h3>
                                                    <span style={{
                                                        fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 600,
                                                        background: candidate.status === 'New' ? 'var(--md-sys-color-primary-container)' :
                                                            candidate.status === 'Interview' ? 'var(--md-sys-color-tertiary-container)' :
                                                                candidate.status === 'Selected' ? '#c8e6c9' : '#e0e0e0',
                                                        color: candidate.status === 'New' ? 'var(--md-sys-color-on-primary-container)' :
                                                            candidate.status === 'Interview' ? 'var(--md-sys-color-on-tertiary-container)' :
                                                                candidate.status === 'Selected' ? '#1b5e20' : '#333'
                                                    }}>
                                                        {candidate.status}
                                                    </span>
                                                </div>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-secondary)' }}>Applying for <span style={{ color: 'var(--md-sys-color-primary)', fontWeight: 500 }}>{candidate.appliedRole}</span></p>
                                            </div>

                                            {/* Metrics */}
                                            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-secondary)' }}>Match</div>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: candidate.matchScore > 80 ? 'green' : 'orange' }}>{candidate.matchScore}%</div>
                                                </div>
                                                <Button variant="glass" style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>➔</Button>
                                            </div>
                                        </GlassContainer>
                                    </motion.div>
                                ))
                            )}
                        </div>

                    </section>
                </ScrollReveal>
            </div>

            {/* Candidate Detail Modal */}
            <AnimatePresence>
                {selectedCandidateId && selectedCandidate && (
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedCandidateId(null)}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 40
                        }}
                    />
                )}
                {selectedCandidateId && selectedCandidate && (
                    <motion.div
                        key="modal-container"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 50, pointerEvents: 'none'
                        }}
                    >
                        <motion.div
                            layoutId={`candidate-${selectedCandidateId}`}
                            style={{
                                width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto',
                                background: 'var(--md-sys-color-surface)', borderRadius: '24px', padding: '0',
                                pointerEvents: 'auto', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                            }}
                        >
                            {/* Modal Header */}
                            <div className={styles.modalHeader}>
                                <Button
                                    variant="glass" onClick={() => setSelectedCandidateId(null)}
                                    className={styles.closeButton}
                                >✕</Button>

                                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                    <div style={{
                                        width: '80px', height: '80px', borderRadius: '50%', background: 'var(--md-sys-color-on-secondary-container)',
                                        color: 'var(--md-sys-color-secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '2rem', fontWeight: 'bold'
                                    }}>
                                        {selectedCandidate.avatarInitials}
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{selectedCandidate.name}</h2>
                                        <p style={{ fontSize: '1rem', color: 'var(--md-sys-color-on-secondary-container)', opacity: 0.8 }}>
                                            {selectedCandidate.appliedRole} • <span style={{ fontWeight: 600 }}>{selectedCandidate.matchScore}% Match</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className={styles.modalGrid}>

                                {/* Left Content */}
                                <div>
                                    <div style={{ marginBottom: '2rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--md-sys-color-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Academic Details</h3>
                                        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.03)', borderRadius: '12px' }}>
                                            <p style={{ marginBottom: '0.5rem' }}><strong>Institution:</strong> {selectedCandidate.institution}</p>
                                            <p style={{ marginBottom: '0.5rem' }}><strong>Program:</strong> {selectedCandidate.program}</p>
                                            <p><strong>Branch:</strong> {selectedCandidate.branch}</p>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '2rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--md-sys-color-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Skills</h3>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {selectedCandidate.skills.map(skill => (
                                                <span key={skill} style={{
                                                    padding: '6px 14px', borderRadius: '20px',
                                                    border: '1px solid var(--md-sys-color-outline, #ccc)',
                                                    fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface)'
                                                }}>
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--md-sys-color-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Contact</h3>
                                        <p>📧 {selectedCandidate.email}</p>
                                    </div>
                                </div>

                                {/* Right Sidebar Actions */}
                                <div className={styles.modalSidebar}>
                                    <div style={{ padding: '1.5rem', background: 'var(--md-sys-color-surface-variant)', borderRadius: '16px' }}>
                                        <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>Actions</h4>

                                        {selectedCandidate.status === 'New' && (
                                            <Button
                                                variant="filled" style={{ width: '100%', marginBottom: '0.75rem' }}
                                                onClick={() => { handleStatusUpdate(selectedCandidate.id, 'Screening'); setSelectedCandidateId(null); }}
                                            >
                                                Shortlist for Screening
                                            </Button>
                                        )}

                                        {selectedCandidate.status === 'Screening' && (
                                            <Button
                                                variant="filled" style={{ width: '100%', marginBottom: '0.75rem' }}
                                                onClick={() => { handleStatusUpdate(selectedCandidate.id, 'Interview'); setSelectedCandidateId(null); }}
                                            >
                                                Approve for Interview
                                            </Button>
                                        )}

                                        {selectedCandidate.status === 'Interview' && (
                                            <Button
                                                variant="filled" style={{ width: '100%', marginBottom: '0.75rem', background: 'green' }}
                                                onClick={() => { handleStatusUpdate(selectedCandidate.id, 'Selected'); setSelectedCandidateId(null); }}
                                            >
                                                ✓ Select Candidate
                                            </Button>
                                        )}

                                        <Button
                                            variant="outlined" style={{ width: '100%', borderColor: 'var(--md-sys-color-error)', color: 'var(--md-sys-color-error)' }}
                                            onClick={() => { handleStatusUpdate(selectedCandidate.id, 'Rejected'); setSelectedCandidateId(null); }}
                                        >
                                            Reject Candidate
                                        </Button>
                                    </div>

                                    <div style={{ padding: '1.5rem', border: '1px solid var(--glass-border)', borderRadius: '16px' }}>
                                        <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Resume</h4>
                                        <a href={`/resume/${selectedCandidate.id}`} target="_blank" rel="noopener noreferrer"
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--md-sys-color-primary)', textDecoration: 'none' }}>
                                            <span>📄</span>
                                            <span style={{ textDecoration: 'underline' }}>View Resume ↗</span>
                                        </a>
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Intern Post Modal */}
                <JobFormModal
                    isOpen={showJobModal}
                    onClose={() => setShowJobModal(false)}
                    onSubmit={handleJobSubmit}
                />
            </AnimatePresence>

        </main>
    );
}
