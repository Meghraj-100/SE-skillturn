"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { marked } from 'marked';

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

const SESSION_CACHE_KEY = 'skillturn_ai_resume_student_preview';

/**
 * Computes a deterministic fingerprint of candidate data.
 * Used to detect profile changes and invalidate session cache only when necessary.
 */
function computeDataFingerprint(data: ResumeModalProps['data']): string {
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

export const ResumeModal: React.FC<ResumeModalProps> = ({ isOpen, onClose, data }) => {
    const [markdown, setMarkdown] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [isCached, setIsCached] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load AI Resume with sessionStorage caching & data-change detection
    useEffect(() => {
        if (!isOpen) return;

        const currentFingerprint = computeDataFingerprint(data);

        // 1. Check if we already have a cached LLM response for this exact profile data in the current session
        try {
            const rawCache = sessionStorage.getItem(SESSION_CACHE_KEY);
            if (rawCache) {
                const cached = JSON.parse(rawCache);
                if (cached && cached.fingerprint === currentFingerprint && cached.markdown) {
                    console.log("[AI Resume] Using cached LLM response from sessionStorage (profile data unchanged).");
                    setMarkdown(cached.markdown);
                    setIsCached(true);
                    setLoading(false);
                    setError(null);
                    return;
                }
            }
        } catch (err) {
            console.warn("[AI Resume] Could not read sessionStorage cache:", err);
        }

        // 2. Either fresh session or profile data changed -> request LLM for fresh response
        console.log("[AI Resume] Fresh session or profile data changed. Requesting new LLM resume...");
        setLoading(true);
        setIsCached(false);
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
            setError("Please log in to generate your AI resume.");
            setLoading(false);
            return;
        }

        let isMounted = true;

        fetch('http://127.0.0.1:8000/generate-resume-markdown', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
            .then(async (res) => {
                if (!res.ok) {
                    const errDetail = await res.text();
                    throw new Error(errDetail || `Status ${res.status}`);
                }
                return res.json();
            })
            .then((result) => {
                if (!isMounted) return;
                const mdContent = result.markdown || '';
                setMarkdown(mdContent);
                setLoading(false);

                // Store in sessionStorage to avoid unnecessary LLM calls
                try {
                    sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({
                        fingerprint: currentFingerprint,
                        markdown: mdContent,
                        cachedAt: Date.now()
                    }));
                    console.log("[AI Resume] Stored new LLM response in sessionStorage.");
                } catch (writeErr) {
                    console.warn("[AI Resume] Failed to write to sessionStorage:", writeErr);
                }
            })
            .catch((err) => {
                if (!isMounted) return;
                console.error("[AI Resume] Request error:", err);
                setError("Failed to generate AI resume. Please try again.");
                setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [isOpen, data]);

    // Download the AI Resume as PDF using the exact cached markdown
    const handleDownloadPDF = async () => {
        if (!markdown) {
            alert("AI Resume preview is still loading. Please wait a moment.");
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
                    candidate_name: data.name || 'Candidate'
                }),
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error("[AI Resume] PDF conversion error:", errText);
                throw new Error("PDF conversion failed.");
            }

            const blob = await response.blob();
            const pdfBlob = new Blob([blob], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);

            const safeName = (data.name || 'Candidate').replace(/\s+/g, '_');
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
        } catch (err) {
            console.error("[AI Resume] Download error:", err);
            alert("Could not download PDF. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    // Render markdown to HTML for preview
    const renderedHtml = useMemo(() => {
        if (!markdown) return '';
        try {
            return marked.parse(markdown) as string;
        } catch (e) {
            console.error("[AI Resume] Marked parse error:", e);
            return markdown;
        }
    }, [markdown]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                        width: '100%',
                        maxWidth: '960px',
                        height: '92vh',
                        background: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.6)'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Toolbar Header */}
                    <div style={{
                        padding: '16px 28px',
                        background: '#1e293b',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.15rem', fontWeight: 600 }}>
                                AI Generated Professional Resume
                            </h2>
                            {isCached ? (
                                <span style={{
                                    background: 'rgba(56, 189, 248, 0.15)',
                                    color: '#38bdf8',
                                    border: '1px solid rgba(56, 189, 248, 0.3)',
                                    padding: '3px 10px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    ⚡ Cached Session
                                </span>
                            ) : (
                                <span style={{
                                    background: 'rgba(168, 85, 247, 0.15)',
                                    color: '#c084fc',
                                    border: '1px solid rgba(168, 85, 247, 0.3)',
                                    padding: '3px 10px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    ✨ Gemma 31B
                                </span>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
                                    padding: '10px 22px',
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
                            <Button
                                variant="glass"
                                onClick={onClose}
                                style={{
                                    color: '#94a3b8',
                                    padding: '10px 18px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                Close
                            </Button>
                        </div>
                    </div>

                    {/* Resume Document Viewer */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '30px 20px',
                        background: '#090d16',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: loading ? 'center' : 'flex-start'
                    }}>
                        {loading && (
                            <div style={{
                                textAlign: 'center',
                                color: '#e2e8f0',
                                padding: '40px 20px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
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
                                    Generating AI-Optimized Resume...
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', maxWidth: '420px', lineHeight: 1.5 }}>
                                    Synthesizing your verified projects and technical skills into an ATS-friendly single-page format via Gemma 31B.
                                </p>
                            </div>
                        )}

                        {error && !loading && (
                            <div style={{
                                textAlign: 'center',
                                color: '#f87171',
                                padding: '40px',
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                borderRadius: '16px',
                                maxWidth: '440px'
                            }}>
                                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚠️</div>
                                <h3 style={{ margin: '0 0 8px 0', color: '#fca5a5' }}>Generation Failed</h3>
                                <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#cbd5e1' }}>{error}</p>
                                <Button
                                    variant="filled"
                                    onClick={() => {
                                        sessionStorage.removeItem(SESSION_CACHE_KEY);
                                        window.location.reload();
                                    }}
                                    style={{ background: '#ef4444', color: '#fff' }}
                                >
                                    Retry
                                </Button>
                            </div>
                        )}

                        {!loading && !error && markdown && (
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
                        )}
                    </div>
                </motion.div>
            </motion.div>

            {/* Document Typography & Styles */}
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
        </AnimatePresence>
    );
};
