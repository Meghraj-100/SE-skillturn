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
  const [facultyOpportunities, setFacultyOpportunities] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [approvalFilter, setApprovalFilter] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [showAllStudents, setShowAllStudents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Post Academic Project Modal State
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [postForm, setPostForm] = useState({
    title: "",
    type: "Project",
    description: "",
    skills: "",
    location: "On-campus",
    salary: "Academic Credit",
    deadline: ""
  });

  // Verification Feedback Modal State
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState<{
    id: string;
    studentId?: string;
    isCategorySkill?: boolean;
    action: 'Approved' | 'Rejected';
    title: string;
  } | null>(null);
  const [feedbackRemarks, setFeedbackRemarks] = useState('');

  const router = useRouter();

  // Fetch Data
  const fetchDashboard = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const [dashRes, pendingRes, oppsRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/faculty/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://127.0.0.1:8000/faculty/pending-projects', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://127.0.0.1:8000/faculty/opportunities', {
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

      if (oppsRes.ok) {
        const oppsData = await oppsRes.json();
        setFacultyOpportunities(oppsData);
      }
    } catch (e) {
      console.error("Failed to fetch dashboard", e);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [router]);

  const totalApplications = applications.length;
  const pendingApprovals = applications.filter(s => s.approvalStatus === 'Pending').length;
  const approvedCount = applications.filter(s => s.approvalStatus === 'Approved').length;

  const filteredDirectory = applications.filter(s =>
    (s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (s.branch?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );
  const displayedApplications = showAllStudents ? filteredDirectory : filteredDirectory.slice(0, 6);

  const openVerificationModal = (
    id: string,
    action: 'Approved' | 'Rejected',
    title: string,
    isCategorySkill: boolean = false,
    studentId?: string
  ) => {
    setVerifyTarget({ id, action, title, isCategorySkill, studentId });
    setFeedbackRemarks('');
    setFeedbackModalOpen(true);
  };

  const submitVerificationWithFeedback = async () => {
    if (!verifyTarget) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setVerifyingId(verifyTarget.id);
    try {
      if (verifyTarget.isCategorySkill) {
        const endpoint = `http://127.0.0.1:8000/faculty/verify/skill/${verifyTarget.studentId}/${verifyTarget.id}?status=${verifyTarget.action}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const displayStatus = verifyTarget.action === 'Approved' ? 'Approved' : 'Rejected';
          setApplications(prev => prev.map(s => s.id === verifyTarget.id ? { ...s, approvalStatus: displayStatus } : s));
        } else {
          const err = await res.json().catch(() => null);
          alert(err?.detail || 'Verification failed');
        }
      } else {
        // Project verification with optional remarks/feedback
        const endpoint = `http://127.0.0.1:8000/faculty/verify-project/${verifyTarget.id}`;
        const res = await fetch(endpoint, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: verifyTarget.action,
            feedback: feedbackRemarks.trim() || undefined
          })
        });

        if (res.ok) {
          const displayStatus = verifyTarget.action === 'Approved' ? 'Approved' : 'Rejected';
          setApplications(prev => prev.map(s => (s.id === verifyTarget.id || s.requestId === verifyTarget.id) ? { ...s, approvalStatus: displayStatus } : s));
          setPendingProjects(prev => prev.filter(p => p.project_id !== verifyTarget.id));
        } else {
          const err = await res.json().catch(() => null);
          alert(err?.detail || 'Verification failed');
        }
      }
      setFeedbackModalOpen(false);
      setVerifyTarget(null);
    } catch (e) {
      console.error("Verification failed", e);
      alert("Verification failed due to a network error.");
    } finally {
      setVerifyingId(null);
    }
  };

  const handlePostProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postForm.title || !postForm.description) {
      alert("Please provide at least a project title and description.");
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    setIsSubmittingPost(true);
    try {
      const skillsArray = postForm.skills
        ? postForm.skills.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const res = await fetch('http://127.0.0.1:8000/faculty/opportunities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: postForm.title,
          type: postForm.type,
          description: postForm.description,
          skills: skillsArray,
          location: postForm.location,
          salary: postForm.salary,
          stipend: postForm.salary,
          deadline: postForm.deadline || undefined
        })
      });

      if (res.ok) {
        const newProject = await res.json();
        setFacultyOpportunities(prev => [newProject, ...prev]);
        setIsPostModalOpen(false);
        setPostForm({
          title: "",
          type: "Project",
          description: "",
          skills: "",
          location: "On-campus",
          salary: "Academic Credit",
          deadline: ""
        });
        alert("✅ Academic project posted successfully!");
      } else {
        const err = await res.json().catch(() => null);
        alert(`❌ Failed to post project: ${err?.detail || "Server error"}`);
      }
    } catch (e) {
      console.error("Failed to post academic project", e);
      alert("❌ Network error.");
    } finally {
      setIsSubmittingPost(false);
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
              Verify student internships, projects, and skills or post academic research projects.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Button variant="filled" onClick={() => setIsPostModalOpen(true)}>
              + Post Academic Project
            </Button>
            <Button variant="outlined" onClick={() => router.push('/facultyprofile')}>My Profile</Button>
          </div>
        </header>
      </ScrollReveal>

      {/* Stats Section */}
      <ScrollReveal width="100%" delay={0.1}>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
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
          <Card variant="elevated">
            <h3 style={{ fontSize: '1rem', color: 'var(--md-sys-color-secondary)', marginBottom: '0.5rem' }}>My Projects</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#6366f1' }}>{facultyOpportunities.length}</div>
          </Card>
        </section>
      </ScrollReveal>

      {/* Faculty Posted Academic Projects Section */}
      <ScrollReveal width="100%" delay={0.12}>
        <section style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
              <span style={{ width: '8px', height: '32px', background: '#6366f1', borderRadius: '4px' }}></span>
              My Posted Academic Projects
              <span style={{
                fontSize: '0.9rem', fontWeight: 600, padding: '4px 12px', borderRadius: '16px',
                background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1'
              }}>
                {facultyOpportunities.length}
              </span>
            </h2>
            <Button variant="filled" onClick={() => setIsPostModalOpen(true)}>+ Post New Project</Button>
          </div>

          {facultyOpportunities.length === 0 ? (
            <GlassContainer style={{ padding: '2rem', textAlign: 'center', color: 'var(--md-sys-color-secondary)' }}>
              <p style={{ margin: '0 0 1rem 0' }}>No academic projects posted yet. Click "+ Post Academic Project" above to publish research or capstone projects for students.</p>
              <Button variant="outlined" onClick={() => setIsPostModalOpen(true)}>Post Academic Project</Button>
            </GlassContainer>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {facultyOpportunities.map((opp: any) => (
                <Card key={opp.id || opp._id} variant="elevated" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>{opp.title}</h3>
                      <span style={{
                        fontSize: '0.75rem', padding: '3px 8px', borderRadius: '12px', fontWeight: 600,
                        background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.3)'
                      }}>
                        {opp.type || 'Project'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-secondary)', marginBottom: '0.75rem' }}>
                      📍 {opp.location || 'On-campus'} • 💰 {opp.salary || opp.stipend || 'Academic Credit'}
                    </p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.5, marginBottom: '1rem' }}>
                      {opp.description}
                    </p>
                    {opp.skills && opp.skills.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        {opp.skills.map((skill: string, idx: number) => (
                          <span key={idx} style={{
                            fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px',
                            background: 'var(--md-sys-color-surface-variant)', color: 'var(--md-sys-color-outline)'
                          }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-secondary)', borderTop: '1px solid rgba(128,128,128,0.15)', paddingTop: '0.75rem' }}>
                    {opp.deadline ? `⏳ Deadline: ${opp.deadline}` : 'No deadline specified'}
                  </div>
                </Card>
              ))}
            </div>
          )}
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
                        variant="outlined"
                        onClick={() => openVerificationModal(proj.project_id, 'Rejected', proj.title, false, proj.student_id)}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="filled"
                        onClick={() => openVerificationModal(proj.project_id, 'Approved', proj.title, false, proj.student_id)}
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
                        <Button variant="outlined" onClick={() => openVerificationModal(app.requestId, 'Rejected', app.shortDescription, app.category === 'Skills', app.studentId)}>Reject</Button>
                        <Button variant="filled" onClick={() => openVerificationModal(app.requestId, 'Approved', app.shortDescription, app.category === 'Skills', app.studentId)}>Approve</Button>
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

      {/* Post Academic Project Modal */}
      <AnimatePresence>
        {isPostModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmittingPost && setIsPostModalOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(4px)',
                zIndex: 60
              }}
            />
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 70,
              padding: '1rem',
              pointerEvents: 'none'
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                style={{
                  width: '100%',
                  maxWidth: '560px',
                  background: 'var(--md-sys-color-surface)',
                  borderRadius: '20px',
                  padding: '2rem',
                  pointerEvents: 'auto',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
                  border: '1px solid var(--md-sys-color-outline-variant)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--md-sys-color-on-surface)' }}>
                    🎓 Post Academic Project
                  </h2>
                  <button
                    onClick={() => setIsPostModalOpen(false)}
                    style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--md-sys-color-secondary)' }}
                  >
                    ✕
                  </button>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--md-sys-color-secondary)', margin: '0 0 1.25rem 0' }}>
                  Publish a research, capstone, or departmental project for students to discover and apply for.
                </p>

                <form onSubmit={handlePostProject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--md-sys-color-on-surface)' }}>
                      Project Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Distributed Consensus in Edge Networks"
                      value={postForm.title}
                      onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        background: 'var(--md-sys-color-surface-container-low)',
                        color: 'var(--md-sys-color-on-surface)',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--md-sys-color-on-surface)' }}>
                        Project Type
                      </label>
                      <select
                        value={postForm.type}
                        onChange={(e) => setPostForm({ ...postForm, type: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--md-sys-color-outline-variant)',
                          background: 'var(--md-sys-color-surface-container-low)',
                          color: 'var(--md-sys-color-on-surface)',
                          fontSize: '0.9rem'
                        }}
                      >
                        <option value="Project">Research Project</option>
                        <option value="Project">Capstone Project</option>
                        <option value="Project">Honors Thesis</option>
                        <option value="Project">Lab Assistantship</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--md-sys-color-on-surface)' }}>
                        Location / Mode
                      </label>
                      <input
                        type="text"
                        placeholder="On-campus / Hybrid / Remote"
                        value={postForm.location}
                        onChange={(e) => setPostForm({ ...postForm, location: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--md-sys-color-outline-variant)',
                          background: 'var(--md-sys-color-surface-container-low)',
                          color: 'var(--md-sys-color-on-surface)',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--md-sys-color-on-surface)' }}>
                      Description & Scope *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Outline research goals, expectations, expected deliverables..."
                      value={postForm.description}
                      onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        background: 'var(--md-sys-color-surface-container-low)',
                        color: 'var(--md-sys-color-on-surface)',
                        fontSize: '0.9rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--md-sys-color-on-surface)' }}>
                      Required Skills (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Python, PyTorch, C++, Distributed Systems"
                      value={postForm.skills}
                      onChange={(e) => setPostForm({ ...postForm, skills: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        background: 'var(--md-sys-color-surface-container-low)',
                        color: 'var(--md-sys-color-on-surface)',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--md-sys-color-on-surface)' }}>
                        Stipend / Credits
                      </label>
                      <input
                        type="text"
                        placeholder="Academic Credit / $500/mo"
                        value={postForm.salary}
                        onChange={(e) => setPostForm({ ...postForm, salary: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--md-sys-color-outline-variant)',
                          background: 'var(--md-sys-color-surface-container-low)',
                          color: 'var(--md-sys-color-on-surface)',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--md-sys-color-on-surface)' }}>
                        Deadline (optional)
                      </label>
                      <input
                        type="date"
                        value={postForm.deadline}
                        onChange={(e) => setPostForm({ ...postForm, deadline: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--md-sys-color-outline-variant)',
                          background: 'var(--md-sys-color-surface-container-low)',
                          color: 'var(--md-sys-color-on-surface)',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                    <Button variant="outlined" type="button" onClick={() => setIsPostModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="filled" type="submit" disabled={isSubmittingPost}>
                      {isSubmittingPost ? 'Posting...' : 'Publish Academic Project'}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Verification Feedback Modal */}
      <AnimatePresence>
        {feedbackModalOpen && verifyTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !verifyingId && setFeedbackModalOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(4px)',
                zIndex: 60
              }}
            />
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 70,
              padding: '1rem',
              pointerEvents: 'none'
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                style={{
                  width: '100%',
                  maxWidth: '480px',
                  background: 'var(--md-sys-color-surface)',
                  borderRadius: '20px',
                  padding: '1.75rem',
                  pointerEvents: 'auto',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
                  border: '1px solid var(--md-sys-color-outline-variant)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--md-sys-color-on-surface)' }}>
                    {verifyTarget.action === 'Approved' ? '✅ Verify Project' : '❌ Reject Project'}
                  </h3>
                  <button
                    onClick={() => setFeedbackModalOpen(false)}
                    style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--md-sys-color-secondary)' }}
                  >
                    ✕
                  </button>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-secondary)', marginBottom: '1rem' }}>
                  <strong>Project:</strong> {verifyTarget.title}
                </p>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--md-sys-color-on-surface)' }}>
                    Feedback / Remarks for Student (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder={verifyTarget.action === 'Approved' ? 'Add commendations or suggested enhancements...' : 'Explain what improvements are required before verification...'}
                    value={feedbackRemarks}
                    onChange={(e) => setFeedbackRemarks(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      background: 'var(--md-sys-color-surface-container-low)',
                      color: 'var(--md-sys-color-on-surface)',
                      fontSize: '0.9rem',
                      resize: 'vertical'
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-secondary)', marginTop: '0.35rem' }}>
                    This remark will be visible on the student's project card on their dashboard.
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <Button variant="outlined" onClick={() => setFeedbackModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="filled"
                    onClick={submitVerificationWithFeedback}
                    disabled={verifyingId !== null}
                    style={{
                      background: verifyTarget.action === 'Rejected' ? '#dc2626' : undefined
                    }}
                  >
                    {verifyingId ? 'Saving...' : `Confirm ${verifyTarget.action}`}
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
