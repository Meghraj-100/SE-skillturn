"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/Button";
import { marked } from 'marked';

interface ResumeData {
    name: string;
    email: string;
    college: string;
    degree: string;
    branch: string;
    skills: string[];
    projects: Array<{ title: string, description: string }>;
}

/**
 * Deterministic fingerprint of candidate data to detect changes and invalidate cache.
 */
function computeDataFingerprint(data: ResumeData | null): string {
    if (!data) return '';
    return JSON.stringify({
        name: (data.name || '').trim(),
        email: (data.email || '').trim().toLowerCase(),
        college: (data.college || '').trim(),
        degree: (data.degree || '').trim(),
        branch: (data.branch || '').trim(),
        skills: [...(data.skills || [])].sort(),
        projects: (data.projects || []).map(p => ({
            title: (p.title || '').trim(),
            description: (p.description || '').trim()
        }))
    });
}

export default function ResumePage() {
    const params = useParams();
    const appId = params.appId as string;

    const [candidateData, setCandidateData] = useState<ResumeData | null>(null);
    const [markdown, setMarkdown] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [isCached, setIsCached] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cacheKey = `skillturn_ai_resume_app_${appId}`;

    // Step 1: Fetch candidate data and check session cache
    useEffect(() => {
        if (!appId) {
            setError("Missing application ID.");
            setLoading(false);
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setError("No authentication token. Please log in as a recruiter.");
            setLoading(false);
            return;
        }

        let isMounted = true;

        const loadResume = async () => {
            try {
                setLoading(true);
                setError(null);

                // 1. Fetch current candidate data
                const dataRes = await fetch(
                    `http://127.0.0.1:8000/recruiter/applications/${appId}/resume-data`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );

                if (!dataRes.ok) {
                    const errText = await dataRes.text();
                    throw new Error(`Failed to load candidate data: ${errText || dataRes.statusText}`);
                }

                const data: ResumeData = await dataRes.json();
                if (!isMounted) return;
                setCandidateData(data);

                const currentFingerprint = computeDataFingerprint(data);

                // 2. Check sessionStorage cache
                try {
                    const rawCache = sessionStorage.getItem(cacheKey);
                    if (rawCache) {
                        const parsed = JSON.parse(rawCache);
                        if (parsed && parsed.fingerprint === currentFingerprint && parsed.markdown) {
                            console.log("[Recruiter Resume] Reusing cached LLM markdown from sessionStorage.");
                            setMarkdown(parsed.markdown);
                            setIsCached(true);
                            setLoading(false);
                            return;
                        }
                    }
                } catch (cacheErr) {
                    console.warn("[Recruiter Resume] Cache read failed:", cacheErr);
                }

                // 3. Cache miss or candidate data changed -> fetch fresh AI markdown
                console.log("[Recruiter Resume] Generating fresh AI resume from LLM...");
                setIsCached(false);

                const mdRes = await fetch(
                    `http://127.0.0.1:8000/recruiter/applications/${appId}/resume-markdown`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );

                if (!mdRes.ok) {
                    const mdErr = await mdRes.text();
                    throw new Error(`Failed to generate AI resume: ${mdErr || mdRes.statusText}`);
                }

                const mdJson = await mdRes.json();
                if (!isMounted) return;

                const generatedMd = mdJson.markdown || '';
                setMarkdown(generatedMd);

                // Store in sessionStorage
                try {
                    sessionStorage.setItem(cacheKey, JSON.stringify({
                        fingerprint: currentFingerprint,
                        markdown: generatedMd,
                        cachedAt: Date.now()
                    }));
                } catch (writeErr) {
                    console.warn("[Recruiter Resume] Cache write failed:", writeErr);
                }
            } catch (err: any) {
                if (!isMounted) return;
                console.error("[Recruiter Resume] Error loading resume:", err);
                setError(err.message || "Could not connect to server.");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadResume();

        return () => {
            isMounted = false;
        };
    }, [appId, cacheKey]);

    // Step 2: Download PDF using cached markdown (no second LLM call)
    const handleDownloadPDF = async () => {
        if (!markdown) {
            alert("AI Resume preview is still generating. Please wait a moment.");
            return;
        }

        setDownloading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("Please log in to download resume.");
                setDownloading(false);
                return;
            }

            const response = await fetch('http://127.0.0.1:8000/convert-markdown-to-pdf', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    markdown: markdown,
                    candidate_name: candidateData?.name || 'Candidate'
                }),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`PDF generation failed: ${errText}`);
            }

            const blob = await response.blob();
            const pdfBlob = new Blob([blob], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);

            const safeName = (candidateData?.name || 'Candidate').replace(/\s+/g, '_');
            const fileName = `${safeName}_AI_Resume.pdf`;

            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();

            // Delay revoking URL so browser download manager has time to save the file
            setTimeout(() => {
                if (document.body.contains(link)) {
                    document.body.removeChild(link);
                }
                window.URL.revokeObjectURL(url);
            }, 60000);
        } catch (err: any) {
            console.error("[Recruiter Resume] PDF download error:", err);
            alert("Failed to download PDF. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    // Render markdown to HTML
    const renderedHtml = useMemo(() => {
        if (!markdown) return '';
        try {
            return marked.parse(markdown) as string;
        } catch (e) {
            console.error("[Recruiter Resume] Markdown parse error:", e);
            return markdown;
        }
    }, [markdown]);

    if (error) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                background: '#090d16',
                textAlign: 'center',
                padding: '20px'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
                <h2 style={{ color: '#f87171', margin: '0 0 10px 0' }}>Resume Preview Failed</h2>
                <p style={{ maxWidth: '440px', margin: '0 0 24px 0', color: '#94a3b8' }}>{error}</p>
                <Button
                    variant="outlined"
                    onClick={() => {
                        sessionStorage.removeItem(cacheKey);
                        window.location.reload();
                    }}
                >
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#090d16', padding: '40px 20px' }}>
            <div style={{ maxWidth: '960px', margin: '0 auto' }}>
                {/* Header Toolbar */}
                <div style={{
                    marginBottom: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#1e293b',
                    padding: '16px 28px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc', fontWeight: 600 }}>
                                AI Generated Candidate Resume
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                                {candidateData ? `Standardized executive profile for ${candidateData.name}` : 'Synthesized with Gemma 31B'}
                            </p>
                        </div>
                        {isCached && (
                            <span style={{
                                background: 'rgba(56, 189, 248, 0.15)',
                                color: '#38bdf8',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                padding: '3px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 600
                            }}>
                                ⚡ Cached Session
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Button
                            variant="filled"
                            onClick={handleDownloadPDF}
                            disabled={loading || downloading}
                            style={{
                                background: downloading
                                    ? '#64748b'
                                    : 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                                color: '#ffffff',
                                border: 'none',
                                padding: '10px 24px',
                                borderRadius: '12px',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                cursor: loading || downloading ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 14px rgba(126, 34, 206, 0.35)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {downloading ? '⏳ Downloading PDF...' : '📄 Download PDF'}
                        </Button>
                    </div>
                </div>

                {/* Main Content: Loading or Document */}
                {loading && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '100px 20px',
                        color: '#f8fafc',
                        gap: '16px'
                    }}>
                        <div style={{
                            width: '54px',
                            height: '54px',
                            borderRadius: '50%',
                            border: '3px solid rgba(168, 85, 247, 0.2)',
                            borderTopColor: '#a855f7',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>
                            Generating AI Candidate Resume...
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>
                            Formatting candidate achievements and verified skills using Gemma 31B.
                        </p>
                    </div>
                )}

                {!loading && markdown && (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div
                            className="ai-resume-sheet"
                            dangerouslySetInnerHTML={{ __html: renderedHtml }}
                            style={{
                                width: '210mm',
                                minHeight: '297mm',
                                padding: '24mm 22mm',
                                background: '#ffffff',
                                color: '#1e293b',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                borderRadius: '3px',
                                fontFamily: 'Helvetica, Arial, sans-serif'
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Scoped Styles for Resume Sheet */}
            <style jsx global>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .ai-resume-sheet {
                    font-size: 10.5pt;
                    line-height: 1.45;
                }
                .ai-resume-sheet h1 {
                    font-size: 22pt;
                    margin: 0 0 4px 0;
                    color: #1a1a2e;
                    text-transform: uppercase;
                    letter-spacing: 1.2px;
                    border-bottom: 2.5px solid #1a1a2e;
                    padding-bottom: 6px;
                }
                .ai-resume-sheet h2 {
                    font-size: 12pt;
                    color: #16213e;
                    margin: 16px 0 6px 0;
                    padding-bottom: 3px;
                    border-bottom: 1px solid #cbd5e1;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    font-weight: 700;
                }
                .ai-resume-sheet h3 {
                    font-size: 11pt;
                    color: #1e293b;
                    margin: 10px 0 3px 0;
                    font-weight: 600;
                }
                .ai-resume-sheet p {
                    margin: 4px 0;
                    color: #334155;
                }
                .ai-resume-sheet ul {
                    margin: 4px 0 8px 0;
                    padding-left: 18px;
                }
                .ai-resume-sheet li {
                    margin-bottom: 3px;
                    color: #334155;
                }
                .ai-resume-sheet strong {
                    color: #0f172a;
                }
                .ai-resume-sheet a {
                    color: #0f3460;
                    text-decoration: none;
                }
                .ai-resume-sheet hr {
                    border: none;
                    border-top: 1px solid #e2e8f0;
                    margin: 12px 0;
                }
            `}</style>
        </div>
    );
}
