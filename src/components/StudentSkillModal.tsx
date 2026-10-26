"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

const PREDEFINED_SKILLS = [
    "JavaScript", "TypeScript", "React", "Next.js", "Node.js",
    "Python", "C++", "C", "Java", "Go", "SQL", "MongoDB",
    "Figma", "Adobe XD", "UI/UX Design", "Machine Learning",
    "Data Analysis", "Project Management", "Agile", "Scrum",
    "HTML", "CSS", "Tailwind CSS", "Docker", "AWS", "Git"
].sort();

interface StudentSkillModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentSkills: string[];
    onUpdate: (skills: string[]) => void;
}

export const StudentSkillModal: React.FC<StudentSkillModalProps> = ({
    isOpen,
    onClose,
    currentSkills,
    onUpdate
}) => {
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [skillSearch, setSkillSearch] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelectedSkills(currentSkills);
            setSkillSearch('');
        }
    }, [isOpen, currentSkills]);

    const toggleSkill = (skill: string) => {
        const normalized = skill.trim();
        if (!normalized) return;

        const isSelected = selectedSkills.some(s => s.toLowerCase() === normalized.toLowerCase());
        const newSkills = isSelected
            ? selectedSkills.filter(s => s.toLowerCase() !== normalized.toLowerCase())
            : [...selectedSkills, normalized];
        setSelectedSkills(newSkills);
    };

    const handleSave = () => {
        onUpdate(selectedSkills);
        onClose();
    };

    const filteredSuggestions = PREDEFINED_SKILLS.filter(s =>
        s.toLowerCase().includes(skillSearch.toLowerCase()) &&
        !selectedSkills.some(selected => selected.toLowerCase() === s.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        style={{
                            width: '95%', maxWidth: '650px', height: '85vh', display: 'flex', flexDirection: 'column',
                            background: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '28px',
                            boxShadow: '0 40px 100px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#fff' }}>Add My Skills</h2>
                                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Build your technical profile to match with top recruiters.</p>
                            </div>
                            <Button variant="glass" onClick={onClose} style={{ minWidth: '40px', height: '40px', padding: 0, borderRadius: '50%' }}>✕</Button>
                        </div>

                        {/* Scrollable Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>

                            {/* Selected Tags Section */}
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
                                    My Selected Skills ({selectedSkills.length})
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    <AnimatePresence>
                                        {selectedSkills.map((skill) => (
                                            <motion.div
                                                key={skill}
                                                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px',
                                                    borderRadius: '12px', background: 'rgba(168, 85, 247, 0.2)',
                                                    color: '#d8b4fe', border: '1px solid rgba(168, 85, 247, 0.3)', fontSize: '0.9rem'
                                                }}
                                            >
                                                {skill}
                                                <span
                                                    onClick={() => toggleSkill(skill)}
                                                    style={{ cursor: 'pointer', opacity: 0.8, fontSize: '14px', fontWeight: 'bold' }}
                                                >✕</span>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    {selectedSkills.length === 0 && (
                                        <div style={{ padding: '20px', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '16px', width: '100%', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                                            No skills added yet. Start searching below!
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Search and Suggestions */}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
                                    Search & Add More
                                </label>
                                <div style={{
                                    display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.03)',
                                    padding: '6px 6px 6px 16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
                                    alignItems: 'center', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                                }}>
                                    <span style={{ opacity: 0.5 }}>🔍</span>
                                    <input
                                        type="text"
                                        value={skillSearch}
                                        onChange={(e) => setSkillSearch(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && skillSearch.trim()) {
                                                e.preventDefault();
                                                toggleSkill(skillSearch.trim());
                                                setSkillSearch('');
                                            }
                                        }}
                                        placeholder="Type a skill (e.g. Kubernetes, React)..."
                                        style={{
                                            flex: 1, background: 'transparent', border: 'none', outline: 'none',
                                            color: '#fff', fontSize: '1rem', padding: '10px 0'
                                        }}
                                    />
                                    {skillSearch.trim() !== '' && (
                                        <Button
                                            variant="filled"
                                            onClick={() => { toggleSkill(skillSearch.trim()); setSkillSearch(''); }}
                                            style={{ borderRadius: '10px', padding: '0 16px', height: '40px' }}
                                        >
                                            + Add
                                        </Button>
                                    )}
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '8px', marginLeft: '12px' }}>
                                    💡 Tip: Press <b>Enter</b> after typing to quickly add a custom skill.
                                </p>
                            </div>

                            {/* Suggestions List - Now in normal flow to avoid overlap */}
                            <div style={{ marginTop: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Suggestions</span>
                                    {skillSearch && <span style={{ fontSize: '0.75rem', color: 'rgba(168, 85, 247, 0.8)' }}>Matching "{skillSearch}"</span>}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                                    {filteredSuggestions.map(skill => (
                                        <motion.div
                                            whileHover={{ background: 'rgba(255,255,255,0.08)', scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            key={skill}
                                            onClick={() => toggleSkill(skill)}
                                            style={{
                                                padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)',
                                                cursor: 'pointer', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)',
                                                textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s'
                                            }}
                                        >
                                            {skill}
                                        </motion.div>
                                    ))}
                                    {skillSearch.trim() !== '' && !PREDEFINED_SKILLS.some(s => s.toLowerCase() === skillSearch.toLowerCase()) && (
                                        <motion.div
                                            whileHover={{ background: 'rgba(168, 85, 247, 0.1)', scale: 1.02 }}
                                            onClick={() => { toggleSkill(skillSearch.trim()); setSkillSearch(''); }}
                                            style={{
                                                padding: '12px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.05)',
                                                cursor: 'pointer', fontSize: '0.9rem', color: '#d8b4fe',
                                                textAlign: 'center', border: '1px dashed rgba(168, 85, 247, 0.3)', fontWeight: 600
                                            }}
                                        >
                                            ✨ Add "{skillSearch}"
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'rgba(255,255,255,0.02)' }}>
                            <Button variant="glass" onClick={onClose} style={{ padding: '0 24px' }}>Cancel</Button>
                            <Button
                                variant="filled"
                                onClick={handleSave}
                                style={{
                                    padding: '0 32px',
                                    background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                                    boxShadow: '0 4px 15px rgba(126, 34, 206, 0.4)'
                                }}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
