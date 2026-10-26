"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/Button";
import { GlassContainer } from "@/components/ui/GlassContainer";
import { motion, AnimatePresence } from "framer-motion";
import { JobFormModal, JobData } from "@/components/JobFormModal";
import styles from "./PostedJobs.module.css";

interface Job extends JobData {
    id: string;
    postedDate: string;
    expirationDate: string;
    status: 'Active' | 'Expired';
    applicants: number;
    views: number;
    title: string;
    type: string;
    skills: string[];
}

export default function PostedJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Expired'>('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);

    const filteredJobs = jobs.filter(job => {
        if (activeTab === 'All') return true;
        return job.status === activeTab;
    });

    const fetchJobs = async () => {
        try {
            const response = await fetch('http://localhost:8000/opportunities');
            if (response.ok) {
                const data = await response.json();
                const dbJobs: Job[] = data.map((j: any) => ({
                    id: j.id,
                    title: j.title,
                    position: j.title,
                    company: j.organization,
                    location: j.location || 'Remote',
                    type: j.type === 'Job' ? 'Full-time' : j.type,
                    tenure: j.type === 'Job' ? 'Full-time' : j.type,
                    salary: j.salary || 'Unpaid',
                    description: j.description,
                    postedDate: new Date(j.posted_date).toLocaleDateString(),
                    expirationDate: j.deadline ? `Until ${j.deadline}` : 'No deadline',
                    status: 'Active',
                    applicants: 0,
                    views: 0,
                    skills: j.skills || []
                }));
                setJobs(dbJobs);
            }
        } catch (error) {
            console.error("Failed to fetch jobs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleManageClick = (job: Job) => {
        setEditingJob(job);
        setIsModalOpen(true);
    };

    const handleJobSave = async (data: JobData) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const payload = {
                title: data.position,
                type: data.tenure === 'Full-time' ? 'Job' : (data.tenure as any),
                organization: data.company,
                description: data.description,
                skills: [], // Could be expanded in modal
                location: data.location,
                salary: data.salary,
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            };

            const response = await fetch('http://localhost:8000/opportunities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                await fetchJobs(); // Refresh all
                setIsModalOpen(false);
                setEditingJob(null);
            }
        } catch (error) {
            console.error("Failed to save job:", error);
        }
    };

    const handleJobDelete = () => {
        // Not implemented on backend yet, but would go here
        if (!editingJob) return;
        alert("Delete functionality coming soon!");
        setIsModalOpen(false);
        setEditingJob(null);
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--md-sys-color-surface)' }}>
                <p>Loading Jobs...</p>
            </div>
        );
    }

    return (
        <main style={{ padding: '2rem 24px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}>

            {/* Header */}
            <header style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>Posted Interns</h1>
                        <p style={{ color: 'var(--md-sys-color-secondary)', marginTop: '0.5rem' }}>
                            Manage your active listings and view past history.
                        </p>
                    </div>
                    <Link href="/recruiter_dashboard">
                        <Button variant="glass">← Back to Dashboard</Button>
                    </Link>
                </div>
            </header>

            {/* Tabs */}
            <div className={styles.tabsContainer}>
                {(['All', 'Active', 'Expired'] as const).map(tab => (
                    <motion.div
                        key={tab}
                        className={`${styles.tabButton} ${activeTab === tab ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab(tab)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {tab} ({jobs.filter(j => tab === 'All' || j.status === tab).length})
                    </motion.div>
                ))}
            </div>

            {/* Intern Grid */}
            <motion.div
                layout
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}
            >
                <AnimatePresence mode="popLayout">
                    {filteredJobs.map((job, index) => {
                        if (!job.id) {
                            console.warn(`Job at index ${index} is missing an ID!`, job);
                        }
                        const jobKey = job.id || `fallback-job-${index}`;
                        return (
                            <motion.div
                                key={jobKey}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                            >
                                <GlassContainer style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{job.title}</h3>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-primary)' }}>{job.company}</p>
                                        </div>
                                        <span style={{
                                            fontSize: '0.75rem', padding: '4px 12px', borderRadius: '12px',
                                            background: job.status === 'Active' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(158, 158, 158, 0.1)',
                                            color: job.status === 'Active' ? 'green' : 'grey',
                                            fontWeight: 600
                                        }}>
                                            {job.status}
                                        </span>
                                    </div>

                                    <div style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-secondary)', marginBottom: '1.5rem', flexGrow: 1 }}>
                                        <p>📍 {job.location}</p>
                                        <p>💼 {job.type}</p>
                                        <p>🕒 Posted {job.postedDate}</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                                            {job.skills?.length > 0 ? job.skills.map((skill, idx) => (
                                                <span key={idx} style={{
                                                    fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px',
                                                    background: 'rgba(var(--md-sys-color-primary-rgb), 0.1)',
                                                    color: 'var(--md-sys-color-primary)', border: '1px solid rgba(var(--md-sys-color-primary-rgb), 0.2)'
                                                }}>
                                                    {skill}
                                                </span>
                                            )) : (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)' }}>No specific skills listed</span>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                            <span title="Applicants">👥 <b>{job.applicants}</b></span>
                                            <span title="Views">👁️ <b>{job.views}</b></span>
                                        </div>
                                        <Button
                                            variant="text"
                                            style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                                            onClick={() => handleManageClick(job)}
                                        >
                                            Manage
                                        </Button>
                                    </div>
                                </GlassContainer>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </motion.div>

            {filteredJobs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--md-sys-color-secondary)' }}>
                    <p>No interns found in this category.</p>
                </div>
            )}

            <JobFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleJobSave}
                initialData={editingJob || undefined}
            />

        </main>
    );
}
