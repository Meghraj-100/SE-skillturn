"use client";

import { Button } from "@/components/ui/Button";
import { GlassContainer } from "@/components/ui/GlassContainer";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// --- Mock Data ---

interface StudentProject {
    id: string;
    title: string;
    description: string;
    project_link: string;
    technologies: string[];
    is_verified: boolean;
    verification_status: 'Pending' | 'Verified' | 'Rejected';
    verified_by: string | null;
}

interface StudentProfile {
    id: string;
    name: string;
    college: string;
    branch: string;
    year: string;
    cgpa: number;
    skills: string[];
    projects?: StudentProject[];
    email: string;
    phone: string;
    location: string;
    bio: string;
    linkedIn?: string;
    github?: string;
    avatarInitials: string;
    resumeLink: string;
}

const COLLEGES = [
    "TechFlow Institute of Technology",
    "Global Engineering College",
    "City University",
    "State Technical Institute"
];

const BRANCHES = [
    "Computer Engineering",
    "Information Technology",
    "Electronics & Telecommunication",
    "Mechanical Engineering",
    "Civil Engineering"
];

const YEARS = ["FE", "SE", "TE", "BE"];

const SKILLS_BY_BRANCH: Record<string, string[]> = {
    "Computer Engineering": ["React", "Node.js", "Python", "Java", "C++", "Machine Learning", "Cloud Computing", "AWS", "Docker"],
    "Information Technology": ["Java", "Spring Boot", "SQL", "Cloud Computing", "AWS", "Web Development", "Data Science"],
    "Electronics & Telecommunication": ["Embedded C", "IoT", "Arduino", "VLSI", "MATLAB", "Signal Processing"],
    "Mechanical Engineering": ["AutoCAD", "SolidWorks", "Thermodynamics", "Ansys", "Manufacturing"],
    "Civil Engineering": ["AutoCAD", "Structural Analysis", "Revit", "Staad Pro", "Surveying"],
};

const MOCK_STUDENTS: StudentProfile[] = []; // Fetched from API


export default function StudentProfilesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const collegeParam = searchParams.get('college');

    const [students, setStudents] = useState<StudentProfile[]>(MOCK_STUDENTS);

    // Fetch Students
    useEffect(() => {
        const fetchStudents = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const res = await fetch('http://127.0.0.1:8000/students', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStudents(data);
                } else {
                    console.error("Failed to fetch students");
                }
            } catch (err) {
                console.error("Error fetching students:", err);
            }
        };
        fetchStudents();
    }, []);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    // Filters State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCollege, setSelectedCollege] = useState<string>(collegeParam || 'All');
    const [selectedBranch, setSelectedBranch] = useState<string>('All');
    const [selectedYear, setSelectedYear] = useState<string>('All');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [minCGPA, setMinCGPA] = useState<number>(0);

    // Dynamic Skill Options State
    const [skillOptions, setSkillOptions] = useState<string[]>([]);

    // Update skill options when branch changes
    useEffect(() => {
        if (selectedBranch === 'All') {
            const allSkills = Array.from(new Set(Object.values(SKILLS_BY_BRANCH).flat()));
            setSkillOptions(allSkills.sort());
        } else {
            setSkillOptions(SKILLS_BY_BRANCH[selectedBranch] || []);
        }
        // When branch changes, we might want to keep relevant selected skills or clear them. 
        // For now, let's remove skills that are no longer valid options, or just keep them? 
        // Let's keep them if they exist in the new branch (or all), otherwise remove.

        // Actually simpler: clear skills if branch changes to avoid confusion, 
        // OR filter `selectedSkills` to only those valid in new scope.
        // Let's clear for simplicity to match previous behavior of reset.
        setSelectedSkills([]);
    }, [selectedBranch]);

    const handleSkillChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value && value !== 'Select Skill' && !selectedSkills.includes(value)) {
            setSelectedSkills([...selectedSkills, value]);
        }
        // Reset select to default
        e.target.value = 'Select Skill';
    };

    const removeSkill = (skillToRemove: string) => {
        setSelectedSkills(selectedSkills.filter(skill => skill !== skillToRemove));
    };

    // Derived Data
    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCollege = selectedCollege === 'All' || student.college === selectedCollege;
        const matchesBranch = selectedBranch === 'All' || student.branch === selectedBranch;
        const matchesYear = selectedYear === 'All' || student.year === selectedYear;

        // AND Logic: Student must have ALL selected skills
        const matchesSkills = selectedSkills.length === 0 || selectedSkills.every(s => student.skills.includes(s));

        const matchesCGPA = student.cgpa >= minCGPA;

        return matchesSearch && matchesCollege && matchesBranch && matchesYear && matchesSkills && matchesCGPA;
    });

    const selectedStudent = students.find(s => s.id === selectedStudentId);

    return (
        <main style={{ padding: '2rem 24px', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh' }}>

            {/* Header */}
            <ScrollReveal width="100%">
                <header style={{ marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, lineHeight: 1.2 }}>Student Profiles</h1>
                            <p style={{ fontSize: '1.1rem', color: 'var(--md-sys-color-secondary)', marginTop: '0.5rem' }}>
                                Explore talents across colleges and disciplines.
                            </p>
                        </div>
                        <Button variant="glass" onClick={() => router.back()}>← Back</Button>
                    </div>
                </header>
            </ScrollReveal>

            {/* Faculty College Filter Banner */}
            {collegeParam && (
                <ScrollReveal width="100%" delay={0.05}>
                    <div style={{
                        marginBottom: '1.5rem',
                        padding: '12px 20px',
                        borderRadius: '16px',
                        background: 'var(--md-sys-color-primary-container)',
                        color: 'var(--md-sys-color-on-primary-container)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.1rem' }}>🏛️</span>
                            <span style={{ fontWeight: 600 }}>
                                Showing students from <strong>{collegeParam}</strong>
                            </span>
                        </div>
                        <Button variant="outlined" onClick={() => {
                            setSelectedCollege('All');
                            router.replace('/studentProfiles');
                        }} style={{ fontSize: '0.85rem', padding: '6px 16px' }}>
                            Show All Colleges
                        </Button>
                    </div>
                </ScrollReveal>
            )}

            {/* Filter Bar */}
            <ScrollReveal width="100%" delay={0.1}>
                <section style={{
                    marginBottom: '2rem',
                    padding: '1.5rem',
                    background: 'var(--md-sys-color-surface)', // Changed from glass for better light mode consistency
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '24px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)' // Subtle shadow for depth
                }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'end' }}>
                        {/* Search */}
                        <div style={{ flex: '1 1 300px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--md-sys-color-secondary)' }}>Search</label>
                            <input
                                type="text"
                                placeholder="Search by Name or Skills..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--md-sys-color-outline)',
                                    background: 'var(--md-sys-color-surface-container)', color: 'var(--md-sys-color-on-surface)', outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--md-sys-color-primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--md-sys-color-outline)'}
                            />
                        </div>

                        {/* College Filter */}
                        <div style={{ flex: '1 1 200px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--md-sys-color-secondary)' }}>College</label>
                            <select
                                value={selectedCollege}
                                onChange={(e) => setSelectedCollege(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--md-sys-color-outline)',
                                    background: 'var(--md-sys-color-surface-container)', color: 'var(--md-sys-color-on-surface)', outline: 'none'
                                }}
                            >
                                <option value="All" style={{ color: 'black' }}>All Colleges</option>
                                {COLLEGES.map(c => <option key={c} value={c} style={{ color: 'black' }}>{c}</option>)}
                            </select>
                        </div>

                        {/* Branch Filter */}
                        <div style={{ flex: '1 1 200px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--md-sys-color-secondary)' }}>Branch</label>
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--md-sys-color-outline)',
                                    background: 'var(--md-sys-color-surface-container)', color: 'var(--md-sys-color-on-surface)', outline: 'none'
                                }}
                            >
                                <option value="All" style={{ color: 'black' }}>All Branches</option>
                                {BRANCHES.map(b => <option key={b} value={b} style={{ color: 'black' }}>{b}</option>)}
                            </select>
                        </div>

                        {/* Dynamic Skill Filter (Multi-Select style) */}
                        <div style={{ flex: '1 1 180px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--md-sys-color-secondary)' }}>
                                Add Skills {selectedBranch !== 'All' ? `(${skillOptions.length} available)` : '(All)'}
                            </label>
                            <select
                                onChange={handleSkillChange}
                                disabled={skillOptions.length === 0}
                                style={{
                                    width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--md-sys-color-outline)',
                                    background: 'var(--md-sys-color-surface-container)', color: 'var(--md-sys-color-on-surface)', outline: 'none',
                                    opacity: skillOptions.length === 0 ? 0.6 : 1
                                }}
                                defaultValue="Select Skill"
                            >
                                <option value="Select Skill" disabled style={{ color: 'black' }}>Select to Add Skill</option>
                                {skillOptions.map(skill => (
                                    <option
                                        key={skill}
                                        value={skill}
                                        disabled={selectedSkills.includes(skill)} // Disable if already selected
                                        style={{ color: 'black' }}
                                    >
                                        {skill} {selectedSkills.includes(skill) ? '(Added)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Year Filter */}
                        <div style={{ flex: '0 1 120px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--md-sys-color-secondary)' }}>Year</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--md-sys-color-outline)',
                                    background: 'var(--md-sys-color-surface-container)', color: 'var(--md-sys-color-on-surface)', outline: 'none'
                                }}
                            >
                                <option value="All" style={{ color: 'black' }}>All</option>
                                {YEARS.map(y => <option key={y} value={y} style={{ color: 'black' }}>{y}</option>)}
                            </select>
                        </div>

                        {/* CGPA Filter */}
                        <div style={{ flex: '0 1 150px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--md-sys-color-secondary)' }}>Min CGPA: {minCGPA}</label>
                            <input
                                type="range"
                                min="0" max="10" step="0.5"
                                value={minCGPA}
                                onChange={(e) => setMinCGPA(parseFloat(e.target.value))}
                                style={{ width: '100%', cursor: 'pointer' }}
                            />
                        </div>
                    </div>

                    {/* Active Filters Display & Selected Skills Chips */}
                    {(selectedBranch !== 'All' || selectedSkills.length > 0 || selectedCollege !== 'All' || selectedYear !== 'All' || searchQuery) && (
                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-secondary)', marginRight: '0.5rem' }}>Active Filters:</span>

                            {selectedBranch !== 'All' && <span style={filterBadgeStyle}>{selectedBranch}</span>}
                            {selectedCollege !== 'All' && <span style={filterBadgeStyle}>{selectedCollege}</span>}
                            {selectedYear !== 'All' && <span style={filterBadgeStyle}>Year: {selectedYear}</span>}

                            {/* Render Selected Skills as Removable Chips */}
                            {selectedSkills.map(skill => (
                                <span key={skill} style={{
                                    ...filterBadgeStyle,
                                    background: 'var(--md-sys-color-primary-container)',
                                    color: 'var(--md-sys-color-on-primary-container)',
                                    display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '8px'
                                }}>
                                    {skill}
                                    <button
                                        onClick={() => removeSkill(skill)}
                                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold', fontSize: '1rem', lineHeight: 1, padding: 0 }}
                                    >×</button>
                                </span>
                            ))}

                        </div>
                    )}

                </section>
            </ScrollReveal>

            {/* Results Grid */}
            <ScrollReveal width="100%" delay={0.2}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', paddingBottom: '4rem' }}>

                    {filteredStudents.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--md-sys-color-secondary)' }}>
                            <p style={{ fontSize: '1.2rem' }}>No profiles found matching criteria.</p>
                            <Button variant="outlined" style={{ marginTop: '1rem' }} onClick={() => {
                                setSelectedBranch('All'); setSelectedSkills([]); setSelectedCollege('All'); setSelectedYear('All'); setSearchQuery('');
                            }}>Clear All Filters</Button>
                        </div>
                    ) : (
                        filteredStudents.map(student => (
                            <motion.div
                                key={student.id}
                                layoutId={`profile-${student.id}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                onClick={() => setSelectedStudentId(student.id)}
                                style={{ cursor: 'pointer' }}
                            >
                                <GlassContainer style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--md-sys-color-surface-container-low)' }}>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div style={{
                                                width: '56px', height: '56px', borderRadius: '50%',
                                                background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold'
                                            }}>
                                                {student.avatarInitials}
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>{student.name}</h3>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-primary)' }}>{student.year} • {student.branch}</p>
                                            </div>
                                        </div>
                                        <div style={{ background: 'var(--md-sys-color-surface-variant)', padding: '4px 8px', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                            CGPA {student.cgpa}
                                        </div>
                                    </div>

                                    <div style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface-variant)', lineHeight: '1.5', flex: 1 }}>
                                        {student.bio}
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {student.skills.slice(0, 3).map(skill => (
                                            <span key={skill} style={{
                                                fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px',
                                                background: 'var(--md-sys-color-secondary-container)', color: 'var(--md-sys-color-on-secondary-container)'
                                            }}>
                                                {skill}
                                            </span>
                                        ))}
                                        {student.skills.length > 3 && (
                                            <span style={{ fontSize: '0.75rem', padding: '4px 8px', color: 'var(--md-sys-color-secondary)' }}>+{student.skills.length - 3}</span>
                                        )}
                                    </div>

                                    <div style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-secondary)', borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: '0.75rem' }}>
                                        🏛️ {student.college.split(' ')[0]}...
                                    </div>

                                </GlassContainer>
                            </motion.div>
                        ))
                    )}
                </div>
            </ScrollReveal>

            {/* Profile Detail Modal */}
            <AnimatePresence>
                {selectedStudentId && selectedStudent && (
                    <>
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedStudentId(null)}
                            style={{
                                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 40
                            }}
                        />
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 50, pointerEvents: 'none'
                        }}>
                            <motion.div
                                layoutId={`profile-${selectedStudentId}`}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                style={{
                                    width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto',
                                    background: 'var(--md-sys-color-surface)', borderRadius: '24px', padding: '0',
                                    pointerEvents: 'auto', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                                }}
                            >
                                <div style={{ padding: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
                                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                            <div style={{
                                                width: '100px', height: '100px', borderRadius: '50%',
                                                background: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold'
                                            }}>
                                                {selectedStudent.avatarInitials}
                                            </div>
                                            <div>
                                                <h2 style={{ fontSize: '2rem', fontWeight: 'bold', lineHeight: 1 }}>{selectedStudent.name}</h2>
                                                <p style={{ fontSize: '1.1rem', color: 'var(--md-sys-color-primary)', margin: '0.25rem 0' }}>{selectedStudent.branch}</p>
                                                <p style={{ color: 'var(--md-sys-color-secondary)' }}>{selectedStudent.college}</p>
                                            </div>
                                        </div>
                                        <Button variant="glass" onClick={() => setSelectedStudentId(null)} style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}>✕</Button>
                                    </div>

                                    <div style={{ display: 'grid', gap: '2rem' }}>

                                        {/* Bio */}
                                        <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1.5rem', borderRadius: '16px' }}>
                                            <p style={{ fontSize: '1rem', lineHeight: '1.6' }}>{selectedStudent.bio}</p>
                                        </div>

                                        {/* Skills */}
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.75rem', color: 'var(--md-sys-color-secondary)' }}>SKILLS</h3>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {selectedStudent.skills.map(skill => (
                                                    <span key={skill} style={{
                                                        padding: '8px 16px', borderRadius: '20px',
                                                        border: '1px solid var(--md-sys-color-outline)',
                                                        fontSize: '0.95rem'
                                                    }}>
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Details Grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                            <div>
                                                <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--md-sys-color-secondary)', textTransform: 'uppercase' }}>Academic</h3>
                                                <div style={{ marginTop: '0.5rem', fontSize: '1.1rem' }}>
                                                    <div><span style={{ fontWeight: 600 }}>Year:</span> {selectedStudent.year}</div>
                                                    <div><span style={{ fontWeight: 600 }}>CGPA:</span> {selectedStudent.cgpa}</div>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--md-sys-color-secondary)', textTransform: 'uppercase' }}>Contact</h3>
                                                <div style={{ marginTop: '0.5rem', fontSize: '1rem' }}>
                                                    <div>{selectedStudent.email}</div>
                                                    <div>{selectedStudent.phone}</div>
                                                    <div>{selectedStudent.location}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                            <Button variant="filled" style={{ flex: 1 }}>Send Message</Button>
                                            <a href={selectedStudent.resumeLink} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textDecoration: 'none' }}>
                                                <Button variant="outlined" style={{ width: '100%' }}>View Resume ↗</Button>
                                            </a>
                                        </div>

                                        {/* Projects Section */}
                                        {selectedStudent.projects && selectedStudent.projects.length > 0 && (
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.75rem', color: 'var(--md-sys-color-secondary)' }}>PROJECTS</h3>
                                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                                    {selectedStudent.projects.map(project => (
                                                        <div key={project.id} style={{
                                                            padding: '1rem 1.25rem',
                                                            borderRadius: '12px',
                                                            border: '1px solid var(--md-sys-color-outline-variant)',
                                                            background: 'var(--md-sys-color-surface-container-low)',
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                                <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{project.title}</h4>
                                                                {project.is_verified ? (
                                                                    <span style={{
                                                                        fontSize: '0.75rem',
                                                                        padding: '3px 10px',
                                                                        borderRadius: '12px',
                                                                        fontWeight: 600,
                                                                        background: 'rgba(76, 175, 80, 0.15)',
                                                                        color: '#2E7D32',
                                                                        border: '1px solid #4CAF50',
                                                                    }}>
                                                                        ✓ Verified by {project.verified_by || 'Faculty'}
                                                                    </span>
                                                                ) : (
                                                                    <span style={{
                                                                        fontSize: '0.75rem',
                                                                        padding: '3px 10px',
                                                                        borderRadius: '12px',
                                                                        fontWeight: 600,
                                                                        background: 'rgba(158, 158, 158, 0.15)',
                                                                        color: '#757575',
                                                                        border: '1px solid #BDBDBD',
                                                                    }}>
                                                                        Pending Verification
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {
                                                                project.description && (
                                                                    <p style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>
                                                                        {project.description}
                                                                    </p>
                                                                )
                                                            }
                                                            {
                                                                project.technologies && project.technologies.length > 0 && (
                                                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                                                        {project.technologies.map(tech => (
                                                                            <span key={tech} style={{
                                                                                fontSize: '0.75rem',
                                                                                color: 'var(--md-sys-color-outline)',
                                                                                background: 'var(--md-sys-color-surface-variant)',
                                                                                padding: '2px 8px',
                                                                                borderRadius: '6px'
                                                                            }}>
                                                                                {tech}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )
                                                            }
                                                            {
                                                                project.project_link && (
                                                                    <a href={project.project_link} target="_blank" rel="noopener noreferrer"
                                                                        style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-primary)', textDecoration: 'none' }}>
                                                                        🔗 View Project ↗
                                                                    </a>
                                                                )
                                                            }
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )
                }
            </AnimatePresence >

        </main >
    );
}

const filterBadgeStyle = {
    padding: '4px 12px',
    background: 'var(--md-sys-color-secondary-container)',
    color: 'var(--md-sys-color-on-secondary-container)',
    borderRadius: '16px',
    fontSize: '0.8rem',
    fontWeight: 600
};
