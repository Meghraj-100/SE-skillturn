"use client";

import React, { useRef } from 'react';
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ResumeModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        name: string;
        email: string;
        college: string;
        degree: string;
        branch: string;
        skills: string[];
        projects: Array<{ title: string, description: string }>;
    };
}

export const ResumeModal: React.FC<ResumeModalProps> = ({ isOpen, onClose, data }) => {
    const resumeRef = useRef<HTMLDivElement>(null);

    const downloadPDF = async () => {
        if (!resumeRef.current) return;

        try {
            const canvas = await html2canvas(resumeRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${data.name.replace(/\s+/g, '_')}_Resume.pdf`);
        } catch (error) {
            console.error("PDF Generation failed:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    style={{
                        width: '100%', maxWidth: '900px', height: '90vh', background: '#f8f9fa',
                        borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Toolbar */}
                    <div style={{ padding: '15px 30px', background: '#fff', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, color: '#333', fontSize: '1.2rem' }}>AI Generated Professional Resume</h2>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Button variant="filled" onClick={downloadPDF}>Download PDF</Button>
                            <Button variant="glass" onClick={onClose} style={{ color: '#666' }}>Close</Button>
                        </div>
                    </div>

                    {/* Resume Canvas */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '40px', background: '#e9ecef' }}>
                        <div
                            ref={resumeRef}
                            style={{
                                width: '210mm', minHeight: '297mm', padding: '25mm',
                                margin: '0 auto', background: 'white', color: '#333',
                                boxShadow: '0 0 20px rgba(0,0,0,0.1)', fontFamily: 'Arial, sans-serif'
                            }}
                        >
                            {/* Header */}
                            <header style={{ borderBottom: '2px solid #333', paddingBottom: '20px', marginBottom: '30px' }}>
                                <h1 style={{ fontSize: '28pt', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>{data.name}</h1>
                                <div style={{ display: 'flex', gap: '20px', color: '#666', fontSize: '11pt' }}>
                                    <span>📧 {data.email}</span>
                                    <span>📍 {data.college}</span>
                                </div>
                            </header>

                            {/* Content */}
                            <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '40px' }}>

                                {/* Left Column */}
                                <div>
                                    <section style={{ marginBottom: '30px' }}>
                                        <h2 style={{ fontSize: '14pt', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '15px', color: '#2c3e50' }}>EDUCATION</h2>
                                        <div style={{ marginBottom: '15px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                                <span>{data.degree} in {data.branch}</span>
                                            </div>
                                            <div style={{ color: '#666' }}>{data.college}</div>
                                        </div>
                                    </section>

                                    <section style={{ marginBottom: '30px' }}>
                                        <h2 style={{ fontSize: '14pt', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '15px', color: '#2c3e50' }}>PROJECTS</h2>
                                        {data.projects.map((proj, i) => (
                                            <div key={i} style={{ marginBottom: '20px' }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '12pt', marginBottom: '5px' }}>{proj.title}</div>
                                                <p style={{ fontSize: '10pt', color: '#444', lineHeight: '1.5', margin: 0 }}>
                                                    {proj.description}
                                                </p>
                                            </div>
                                        ))}
                                    </section>
                                </div>

                                {/* Right Column */}
                                <div>
                                    <section style={{ marginBottom: '30px' }}>
                                        <h2 style={{ fontSize: '14pt', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '15px', color: '#2c3e50' }}>SKILLS</h2>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {data.skills.map((skill, i) => (
                                                <span key={i} style={{
                                                    background: '#f0f2f5', padding: '4px 10px',
                                                    borderRadius: '4px', fontSize: '9pt', color: '#555'
                                                }}>
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            </div>

                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
