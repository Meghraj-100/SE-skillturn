"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { motion, AnimatePresence } from "framer-motion";
import styles from "@/app/recruiter_dashboard/dashboard.module.css"; // Reuse dashboard styles for consistency

const PREDEFINED_SKILLS = [
    "JavaScript", "TypeScript", "React", "Next.js", "Node.js",
    "Python", "C++", "C", "Java", "Go", "SQL", "MongoDB",
    "Figma", "Adobe XD", "UI/UX Design", "Machine Learning",
    "Data Analysis", "Project Management", "Agile", "Scrum",
    "HTML", "CSS", "Tailwind CSS", "Docker", "AWS", "Git"
].sort();

export interface JobData {
    position: string;
    company: string;
    tenure: string;
    location: string;
    salary: string;
    description: string;
    skills: string[];
}

interface JobFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: JobData) => void;
    initialData?: JobData;
    onDelete?: () => void;
}

export const JobFormModal: React.FC<JobFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    onDelete
}) => {
    const isEditMode = !!initialData;

    const [formData, setFormData] = useState<JobData>({
        position: '',
        company: 'TechFlow Industries',
        tenure: '',
        location: '',
        salary: '',
        description: '',
        skills: []
    });

    const [skillSearch, setSkillSearch] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Reset or populate form when opening/changing data
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    ...initialData,
                    skills: initialData.skills || []
                });
            } else {
                setFormData({
                    position: '',
                    company: 'TechFlow Industries',
                    tenure: '',
                    location: '',
                    salary: '',
                    description: '',
                    skills: []
                });
            }
            setSkillSearch('');
            setShowSuggestions(false);
        }
    }, [isOpen, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleSkill = (skill: string) => {
        setFormData(prev => {
            const isSelected = prev.skills.includes(skill);
            return {
                ...prev,
                skills: isSelected
                    ? prev.skills.filter(s => s !== skill)
                    : [...prev.skills, skill]
            };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    const filteredSuggestions = PREDEFINED_SKILLS.filter(s =>
        s.toLowerCase().includes(skillSearch.toLowerCase()) && !formData.skills.includes(s)
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                        style={{
                            width: '90%', maxWidth: '800px', maxHeight: '95vh', overflowY: 'auto',
                            background: 'var(--md-sys-color-surface)', borderRadius: '24px',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={styles.modalHeader}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                                {isEditMode ? 'Edit Job' : 'Post a New Job'}
                            </h2>
                            <Button
                                variant="glass" onClick={onClose}
                                className={styles.closeButton}
                            >✕</Button>
                        </div>

                        <form className={styles.formGrid} onSubmit={handleSubmit}>
                            <FormInput
                                label="Job Position" name="position" value={formData.position} onChange={handleChange} required placeholder="e.g. Senior Frontend Engineer"
                            />
                            <FormInput
                                label="Company Name" name="company" value={formData.company} onChange={handleChange} required placeholder="e.g. TechFlow Industries"
                            />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--md-sys-color-on-surface)' }}>
                                    Job Type <span style={{ color: 'var(--md-sys-color-error)' }}>*</span>
                                </label>
                                <select
                                    name="tenure"
                                    value={formData.tenure}
                                    onChange={handleChange}
                                    required
                                    style={{
                                        padding: '0.75rem', borderRadius: '12px',
                                        border: '1px solid var(--md-sys-color-outline)',
                                        background: 'var(--md-sys-color-surface)',
                                        color: 'var(--md-sys-color-on-surface)',
                                        fontFamily: 'inherit', fontSize: '0.95rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="" disabled>Select type...</option>
                                    <option value="Internship">Internship</option>
                                    <option value="Project">Project</option>
                                    <option value="Job">Full-time Job</option>
                                </select>
                            </div>

                            <FormInput
                                label="Location" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Remote, New York, NY" required
                            />

                            <div className={styles.fullWidth}>
                                <FormInput
                                    label="Salary Range" name="salary" value={formData.salary} onChange={handleChange} placeholder="e.g. $120k - $150k"
                                />
                            </div>

                            {/* Skills Selection Section */}
                            <div className={styles.fullWidth} style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, color: 'var(--md-sys-color-on-surface)', marginBottom: '0.5rem' }}>
                                    Required Skills
                                </label>

                                <div style={{ position: 'relative' }}>
                                    <div style={{
                                        display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px',
                                        border: '1px solid var(--md-sys-color-outline)', borderRadius: '12px',
                                        background: 'var(--md-sys-color-surface)', minHeight: '52px', alignItems: 'center'
                                    }}>
                                        {formData.skills.map((skill, index) => (
                                            <div key={index} style={{
                                                display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px',
                                                borderRadius: '100px', background: 'var(--md-sys-color-primary)',
                                                color: 'var(--md-sys-color-on-primary)', fontSize: '0.85rem'
                                            }}>
                                                {skill}
                                                <span
                                                    onClick={() => toggleSkill(skill)}
                                                    style={{ cursor: 'pointer', opacity: 0.8, fontWeight: 'bold' }}
                                                >✕</span>
                                            </div>
                                        ))}
                                        <input
                                            type="text"
                                            value={skillSearch}
                                            onChange={(e) => {
                                                setSkillSearch(e.target.value);
                                                setShowSuggestions(true);
                                            }}
                                            onFocus={() => setShowSuggestions(true)}
                                            placeholder={formData.skills.length === 0 ? "Search and select skills..." : ""}
                                            style={{
                                                flex: 1, border: 'none', background: 'transparent', outline: 'none',
                                                color: 'var(--md-sys-color-on-surface)', padding: '4px', minWidth: '120px'
                                            }}
                                        />
                                        <div
                                            onClick={() => setShowSuggestions(!showSuggestions)}
                                            style={{
                                                width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.05)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                                fontSize: '1.2rem', transition: 'all 0.2s',
                                                transform: showSuggestions ? 'rotate(45deg)' : 'rotate(0deg)'
                                            }}
                                        >
                                            +
                                        </div>
                                    </div>

                                    {/* Suggestions Dropdown */}
                                    <AnimatePresence>
                                        {showSuggestions && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                                style={{
                                                    position: 'absolute', top: '110%', left: 0, right: 0,
                                                    maxHeight: '200px', overflowY: 'auto', background: 'var(--md-sys-color-surface)',
                                                    borderRadius: '12px', border: '1px solid var(--md-sys-color-outline)',
                                                    zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', padding: '8px'
                                                }}
                                            >
                                                {filteredSuggestions.length > 0 ? (
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '4px' }}>
                                                        {filteredSuggestions.map(skill => (
                                                            <div
                                                                key={skill}
                                                                onClick={() => {
                                                                    toggleSkill(skill);
                                                                    setSkillSearch('');
                                                                }}
                                                                style={{
                                                                    padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                                                                    fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface)',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                            >
                                                                {skill}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div style={{ padding: '12px', textAlign: 'center', color: 'var(--md-sys-color-secondary)', fontSize: '0.9rem' }}>
                                                        No more matching skills found.
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className={styles.fullWidth} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--md-sys-color-on-surface)' }}>Job Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter detailed job description here..."
                                    style={{
                                        padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--md-sys-color-outline)',
                                        background: 'var(--md-sys-color-surface)', color: 'var(--md-sys-color-on-surface)',
                                        minHeight: '120px', resize: 'vertical', fontFamily: 'inherit'
                                    }}
                                />
                            </div>

                            <div className={styles.fullWidth} style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>

                                {isEditMode && onDelete && (
                                    <div style={{ marginRight: 'auto' }}>
                                        <Button type="button" variant="outlined"
                                            style={{ borderColor: 'var(--md-sys-color-error)', color: 'var(--md-sys-color-error)' }}
                                            onClick={() => {
                                                if (confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
                                                    onDelete();
                                                    onClose();
                                                }
                                            }}
                                        >
                                            Delete Job
                                        </Button>
                                    </div>
                                )}

                                <Button type="button" variant="outlined" onClick={onClose}>Cancel</Button>
                                <Button type="submit" variant="filled">
                                    {isEditMode ? 'Save Changes' : 'Post Job'}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
