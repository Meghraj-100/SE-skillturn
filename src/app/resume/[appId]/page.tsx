"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/Button";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ResumeData {
    name: string;
    email: string;
    college: string;
    degree: string;
    branch: string;
    skills: string[];
    projects: Array<{ title: string, description: string }>;
}

export default function ResumePage() {
    const params = useParams();
    const appId = params.appId as string;
    const [data, setData] = useState<ResumeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const resumeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            console.log("ResumePage: Starting fetch for", appId);
            const token = localStorage.getItem('token');

            if (!token) {
                console.error("ResumePage: No token found");
                setError("No authentication token. Please log in as a recruiter.");
                setLoading(false);
                return;
            }

            try {
                const apiURL = `http://127.0.0.1:8000/recruiter/applications/${appId}/resume-data`;
                console.log("ResumePage: Fetching from", apiURL);

                const response = await fetch(apiURL, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log("ResumePage: Data received successfully");
                    setData(result);
                } else {
                    const errText = await response.text();
                    console.error("ResumePage: API error", response.status, errText);
                    setError(`Failed to load resume (Error ${response.status})`);
                }
            } catch (err: any) {
                console.error("ResumePage: Network error", err);
                setError(`Could not connect to server: ${err.message}`);
            } finally {
                console.log("ResumePage: Fetch complete, hiding loader");
                setLoading(false);
            }
        };

        if (appId) {
            fetchData();
        } else {
            console.warn("ResumePage: Missing appId");
            setLoading(false);
        }
    }, [appId]);

    const downloadPDF = async () => {
        if (!resumeRef.current || !data) return;

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

    if (error) return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', color: '#fff', background: '#121212', textAlign: 'center', padding: '20px' }}>
            <h2 style={{ color: '#F44336' }}>⚠️ Resume Generation Failed</h2>
            <p style={{ maxWidth: '400px', margin: '15px 0', opacity: 0.8 }}>{error}</p>
            <Button variant="outlined" onClick={() => window.location.reload()}>Try Again</Button>
        </div>
    );

    if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: '#fff', background: '#121212' }}>Generating Resume Preview...</div>;
    if (!data) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: '#fff', background: '#121212' }}>Candidate Resume Not Found</div>;

    return (
        <div style={{ minHeight: '100vh', background: '#e9ecef', padding: '40px 20px' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '15px 30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#333' }}>AI Generated Resume</h2>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Standardized professional format for {data.name}</p>
                    </div>
                    <Button variant="filled" onClick={downloadPDF}>Download as PDF</Button>
                </div>

                <div
                    ref={resumeRef}
                    style={{
                        width: '210mm', minHeight: '297mm', padding: '25mm',
                        margin: '0 auto', background: 'white', color: '#333',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontFamily: 'Arial, sans-serif'
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
        </div>
    );
}
