"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { GlassContainer } from "@/components/ui/GlassContainer";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Student } from "@/context/AuthContext";

// Extended type for Dashboard purposes (Student + Application Request Info)
interface StudentApplication extends Student {
  studentId?: string; // Mapped from backend ID

  requestId: string;
  category: 'Internship' | 'Project' | 'Skills';
  shortDescription: string;
  detailedDescription: string;
  documents: string[];
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';

  // Specific to Internship category
  internshipDomain?: string;
  companyName?: string;
  duration?: string;

  // Specific to Project category
  projectTitle?: string;
  projectDomain?: string;
  teamSize?: number;

  // Specific to Skills category
  skillName?: string;
  proficiencyLevel?: string;
  certificationUrl?: string;
}

interface PendingProject {
  project_id: string;
  student_id: string;
  student_name: string;
  student_roll: string;
  student_branch: string;
  title: string;
  description: string;
  project_link: string;
  technologies: string[];
  created_at: string | null;
}

// Removed mock data

export default function FacultyDashboardPage() {
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [pendingProjects, setPendingProjects] = useState<PendingProject[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [approvalFilter, setApprovalFilter] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [showAllStudents, setShowAllStudents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const router = useRouter();

  // Fetch Data
  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        const [dashRes, pendingRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/faculty/dashboard', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://127.0.0.1:8000/faculty/pending-projects', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (dashRes.ok) {
          const data = await dashRes.json();
          const mapped = data.map((item: any) => ({
            ...item,
            id: item.requestId,
            studentId: item.id
          }));
          setApplications(mapped);
        }

        if (pendingRes.ok) {
          const pendingData = await pendingRes.json();
          setPendingProjects(pendingData);
        }
      } catch (e) {
        console.error("Failed to fetch dashboard", e);
      }
    };
    fetchDashboard();
  }, [router]);

  const totalApplications = applications.length;
  const pendingApprovals = applications.filter(s => s.approvalStatus === 'Pending').length;
  const approvedCount = applications.filter(s => s.approvalStatus === 'Approved').length;

  const filteredDirectory = applications.filter(s =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.branch.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const displayedApplications = showAllStudents ? filteredDirectory : filteredDirectory.slice(0, 6);

  const handleApproval = async (id: string, status: 'Approved' | 'Rejected') => {
    const app = applications.find(s => s.id === id);
    if (!app || !app.studentId) return;

    const token = localStorage.getItem('token');
    let endpoint: string;
    let method: string;

    if (app.category === 'Skills') {
      endpoint = `http://127.0.0.1:8000/faculty/verify/skill/${app.studentId}/${app.requestId}?status=${status}`;
      method = 'POST';
    } else {
      endpoint = `http://127.0.0.1:8000/faculty/verify-project/${app.requestId}`;
      method = 'PATCH';
    }

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        // Backend maps Approved→Verified, so update local state accordingly
        const displayStatus = status === 'Approved' ? 'Approved' : 'Rejected';
        setApplications(prev => prev.map(s => s.id === id ? { ...s, approvalStatus: displayStatus } : s));
        // Also remove from pending list if it was a project
        if (app.category === 'Project') {
          setPendingProjects(prev => prev.filter(p => p.project_id !== app.requestId));
        }
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.detail || 'Verification failed');
      }
    } catch (e) {
      console.error("Verification failed", e);
    }
  };

  const selectedApp = applications.find(s => s.id === selectedAppId);

  return (
    <main style={{ padding: '2rem 24px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}>
      <ScrollReveal width="100%">
        <header style={{
          marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem'
        }}>
          <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Faculty Dashboard</h2>
            <p style={{ fontSize: '1.0rem', color: 'var(--md-sys-color-secondary)' }}>
              Verify student internships, projects, and skills.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>

            <Button variant="outlined" onClick={() => router.push('/facultyprofile')}>My Profile</Button>
          </div>
        </header>
      </ScrollReveal>

      {/* Stats Section */}
      <ScrollReveal width="100%" delay={0.1}>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
          <Card variant="elevated">
            <h3 style={{ fontSize: '1rem', color: 'var(--md-sys-color-secondary)', marginBottom: '0.5rem' }}>Total Requests</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--md-sys-color-on-surface)' }}>{totalApplications}</div>
          </Card>
          <Card variant="elevated">
            <h3 style={{ fontSize: '1rem', color: 'var(--md-sys-color-secondary)', marginBottom: '0.5rem' }}>Pending</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--md-sys-color-error)' }}>{pendingApprovals}</div>
          </Card>
          <Card variant="elevated">
            <h3 style={{ fontSize: '1rem', color: 'var(--md-sys-color-secondary)', marginBottom: '0.5rem' }}>Approved</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--md-sys-color-primary)' }}>{approvedCount}</div>
          </Card>
        </section>
      </ScrollReveal>

      {/* Pending Verifications Section */}
      {pendingProjects.length > 0 && (
        <ScrollReveal width="100%" delay={0.15}>
          <section style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '8px', height: '32px', background: 'var(--md-sys-color-error)', borderRadius: '4px' }}></span>
              Pending Verifications
              <span style={{
                fontSize: '0.9rem', fontWeight: 600, padding: '4px 12px', borderRadius: '16px',
                background: 'rgba(244, 67, 54, 0.1)', color: 'var(--md-sys-color-error)'
              }}>
                {pendingProjects.length}
              </span>
            </h2>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {pendingProjects.map(proj => (
                <motion.div key={proj.project_id} layout>
                  <GlassContainer style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    padding: '1.25rem 1.5rem', flexWrap: 'wrap', gap: '1rem'
                  }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.4rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>{proj.title}</h3>
                        <span style={{
                          fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 600,
                          background: 'rgba(255, 193, 7, 0.15)', color: '#F57F17', border: '1px solid #FFC107'
                        }}>
                          ⏳ Pending
                        </span>
                      </div>
                      <p style={{ fontSize: '0.95rem', color: 'var(--md-sys-color-secondary)', marginBottom: '0.3rem' }}>
                        👤 {proj.student_name} • {proj.student_roll} • {proj.student_branch}
                      </p>
                      {proj.description && (
                        <p style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '0.4rem', lineHeight: 1.4 }}>
                          {proj.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {proj.technologies.map(tech => (
                          <span key={tech} style={{
                            fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px',
                            background: 'var(--md-sys-color-surface-variant)', color: 'var(--md-sys-color-outline)'
                          }}>
                            {tech}
                          </span>
                        ))}
                        {proj.project_link && (
                          <a href={proj.project_link} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-primary)', textDecoration: 'none', marginLeft: '0.25rem' }}>
                            🔗 View Project ↗
                          </a>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'center' }}>
                      <Button
                        variant="filled"
                        onClick={async () => {
                          setVerifyingId(proj.project_id);
                          const token = localStorage.getItem('token');
                          try {
                            const res = await fetch(
                              `http://127.0.0.1:8000/faculty/verify-project/${proj.project_id}`,
                              { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } }
                            );
                            if (res.ok) {
                              setPendingProjects(prev => prev.filter(p => p.project_id !== proj.project_id));
                            } else {
                              const err = await res.json().catch(() => null);
                              alert(err?.detail || 'Verification failed');
                            }
                          } catch (e) {
                            console.error('Verify failed', e);
                          } finally {
                            setVerifyingId(null);
                          }
                        }}
                        style={{ minWidth: '100px' }}
                      >
                        {verifyingId === proj.project_id ? '...' : '✓ Verify'}
                      </Button>
                    </div>
                  </GlassContainer>
                </motion.div>
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Approval Section */}
      <ScrollReveal width="100%" delay={0.2}>
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '8px', height: '32px', background: 'var(--md-sys-color-tertiary)', borderRadius: '4px' }}></span>
            Approvals
          </h2>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            {(['Pending', 'Approved', 'Rejected'] as const).map(status => (
              <Button
                key={status}
                variant={approvalFilter === status ? 'filled' : 'outlined'}
                onClick={() => setApprovalFilter(status)}
                style={{ borderRadius: '20px' }}
              >
                {status} ({applications.filter(a => a.approvalStatus === status).length})
              </Button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {applications.filter(s => s.approvalStatus === approvalFilter).map(app => (
              <motion.div layoutId={`app-${app.id}`} key={app.id}>
                <GlassContainer style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.25rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{app.full_name}</h3>
                      <span style={{
                        fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 600,
                        background: 'rgba(0,0,0,0.05)'
                      }}>
                        {app.category}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>{app.shortDescription}</p>
                    <p style={{ color: 'var(--md-sys-color-secondary)', fontSize: '0.8rem' }}>{app.rollNumber} • {app.branch} • Year {app.yearsOfStudy}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {app.approvalStatus === 'Pending' && (
                      <>
                        <Button variant="outlined" onClick={() => handleApproval(app.id, 'Rejected')}>Reject</Button>
                        <Button variant="filled" onClick={() => handleApproval(app.id, 'Approved')}>Approve</Button>
                      </>
                    )}
                    <Button variant="glass" onClick={() => setSelectedAppId(app.id)}>Details</Button>
                  </div>
                </GlassContainer>
              </motion.div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* Modal */}
      <AnimatePresence>
        {selectedAppId && selectedApp && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedAppId(null)}
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 40 }}
            />
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, pointerEvents: 'none' }}>
              <motion.div
                layoutId={selectedAppId}
                style={{ width: '90%', maxWidth: '600px', background: 'var(--md-sys-color-surface)', borderRadius: '24px', padding: '2rem', pointerEvents: 'auto', maxHeight: '85vh', overflowY: 'auto' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{selectedApp.full_name}</h2>
                    <p style={{ color: 'var(--md-sys-color-secondary)' }}>{selectedApp.rollNumber} • {selectedApp.branch}</p>
                    <p style={{ color: 'var(--md-sys-color-secondary)', fontSize: '0.9rem' }}>{selectedApp.collegeName} • {selectedApp.degree}</p>
                  </div>
                  <Button variant="glass" onClick={() => setSelectedAppId(null)} style={{ height: 'fit-content' }}>✕</Button>
                </div>

                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.03)', borderRadius: '12px' }}>
                  <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Request Details</h3>
                  <p><strong>Category:</strong> {selectedApp.category}</p>
                  <p><strong>Description:</strong> {selectedApp.detailedDescription}</p>

                  {/* Internship-specific fields */}
                  {selectedApp.internshipDomain && <p><strong>Domain:</strong> {selectedApp.internshipDomain}</p>}
                  {selectedApp.companyName && <p><strong>Company:</strong> {selectedApp.companyName}</p>}
                  {selectedApp.duration && <p><strong>Duration:</strong> {selectedApp.duration}</p>}

                  {/* Project-specific fields */}
                  {selectedApp.projectTitle && <p><strong>Project Title:</strong> {selectedApp.projectTitle}</p>}
                  {selectedApp.projectDomain && <p><strong>Project Domain:</strong> {selectedApp.projectDomain}</p>}
                  {selectedApp.teamSize && <p><strong>Team Size:</strong> {selectedApp.teamSize}</p>}

                  {/* Skills-specific fields */}
                  {selectedApp.skillName && <p><strong>Skill:</strong> {selectedApp.skillName}</p>}
                  {selectedApp.proficiencyLevel && <p><strong>Proficiency:</strong> {selectedApp.proficiencyLevel}</p>}
                  {selectedApp.certificationUrl && (
                    <p><strong>Certification:</strong>{' '}
                      <a href={selectedApp.certificationUrl} target="_blank" rel="noopener noreferrer"
                        style={{ color: 'var(--md-sys-color-primary)', textDecoration: 'underline' }}>
                        View Certificate ↗
                      </a>
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Contact</h3>
                  <p>Email: {selectedApp.collegeEmail}</p>
                  <p>Personal Email: {selectedApp.email}</p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Documents</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {selectedApp.documents.map((doc, i) => (
                      <a
                        key={i}
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '6px 12px',
                          background: 'var(--md-sys-color-secondary-container)',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          textDecoration: 'none',
                          color: 'var(--md-sys-color-on-secondary-container)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                      >
                        📁 <span style={{ textDecoration: 'underline' }}>Drive Document {i + 1}</span> ↗
                      </a>
                    ))}
                  </div>
                </div>

              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
