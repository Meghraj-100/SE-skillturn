"use client";

import { GlassContainer } from "@/components/ui/GlassContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter,
    LineChart, Line,
} from "recharts";
import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════
//  MOCK DATA
// ═══════════════════════════════════════════════

const COLLEGES = ["IIIT Pune", "COEP", "PICT", "VIT Pune"];

// 1. Heatmap data — shortlist % per college × role
const HEATMAP_ROLES = ["SDE", "Data Analyst", "UI/UX", "DevOps", "ML Engineer"];
const HEATMAP_DATA: Record<string, Record<string, number>> = {
    "IIIT Pune": { "SDE": 42, "Data Analyst": 28, "UI/UX": 15, "DevOps": 35, "ML Engineer": 38 },
    "COEP": { "SDE": 55, "Data Analyst": 40, "UI/UX": 22, "DevOps": 30, "ML Engineer": 48 },
    "PICT": { "SDE": 38, "Data Analyst": 32, "UI/UX": 45, "DevOps": 20, "ML Engineer": 25 },
    "VIT Pune": { "SDE": 30, "Data Analyst": 22, "UI/UX": 18, "DevOps": 42, "ML Engineer": 20 },
};

// 2. College-wise selection rate
const COLLEGE_SELECTION_DATA = [
    { college: "IIIT Pune", shortlisted: 120, selected: 45 },
    { college: "COEP", shortlisted: 150, selected: 68 },
    { college: "PICT", shortlisted: 95, selected: 35 },
    { college: "VIT Pune", shortlisted: 110, selected: 40 },
];

// 3. Interview funnel
const FUNNEL_DATA = [
    { name: "Profiles Viewed", value: 2450, fill: "#6366f1" },
    { name: "Shortlisted", value: 475, fill: "#8b5cf6" },
    { name: "Interviewed", value: 210, fill: "#a78bfa" },
    { name: "Selected", value: 88, fill: "#c4b5fd" },
    { name: "Offer Accepted", value: 72, fill: "#ddd6fe" },
];

// 4. Role-wise selection %
const ROLE_SELECTION_DATA = [
    { role: "SDE", percentage: 18 },
    { role: "Data Analyst", percentage: 12 },
    { role: "UI/UX Designer", percentage: 9 },
    { role: "DevOps Engineer", percentage: 14 },
    { role: "ML Engineer", percentage: 11 },
    { role: "Product Manager", percentage: 7 },
];

// 5. Skill availability vs hiring demand
const SKILL_DEMAND_DATA = [
    { skill: "React", students: 60, hired: 25 },
    { skill: "Python", students: 55, hired: 30 },
    { skill: "Node.js", students: 40, hired: 22 },
    { skill: "Java", students: 50, hired: 28 },
    { skill: "AWS", students: 25, hired: 18 },
    { skill: "Docker", students: 20, hired: 15 },
    { skill: "ML/AI", students: 35, hired: 20 },
];

// 6. CGPA vs selection scatter
const SCATTER_DATA = [
    { cgpa: 9.8, score: 95, selected: true }, { cgpa: 9.5, score: 88, selected: true },
    { cgpa: 9.2, score: 92, selected: true }, { cgpa: 8.9, score: 75, selected: true },
    { cgpa: 8.5, score: 60, selected: false }, { cgpa: 8.2, score: 70, selected: true },
    { cgpa: 7.8, score: 55, selected: false }, { cgpa: 7.5, score: 82, selected: true },
    { cgpa: 7.2, score: 45, selected: false }, { cgpa: 6.8, score: 40, selected: false },
    { cgpa: 6.5, score: 65, selected: false }, { cgpa: 9.0, score: 50, selected: false },
    { cgpa: 8.0, score: 85, selected: true }, { cgpa: 7.0, score: 78, selected: true },
    { cgpa: 6.2, score: 30, selected: false }, { cgpa: 8.8, score: 68, selected: false },
];

// 7. Institution talent quality index
const QUALITY_INDEX_DATA = [
    { college: "COEP", score: 87 },
    { college: "IIIT Pune", score: 82 },
    { college: "PICT", score: 74 },
    { college: "VIT Pune", score: 68 },
];

// 8. Degree distribution
const DEGREE_DATA = [
    { name: "B.Tech", value: 58 },
    { name: "M.Tech", value: 18 },
    { name: "MBA", value: 12 },
    { name: "BSc/BCA", value: 8 },
    { name: "MCA", value: 4 },
];
const DEGREE_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#e0e7ff"];

// 9. Hiring trend over time
const HIRING_TREND_DATA = [
    { month: "Aug", selections: 8 },
    { month: "Sep", selections: 15 },
    { month: "Oct", selections: 22 },
    { month: "Nov", selections: 18 },
    { month: "Dec", selections: 12 },
    { month: "Jan", selections: 28 },
    { month: "Feb", selections: 35 },
    { month: "Mar", selections: 42 },
    { month: "Apr", selections: 30 },
    { month: "May", selections: 20 },
    { month: "Jun", selections: 10 },
    { month: "Jul", selections: 5 },
];

// 10. Activity impact analysis
const ACTIVITY_IMPACT_DATA = [
    { category: "Selected", internships: 65, hackathons: 48, research: 30, certifications: 55 },
    { category: "Shortlisted", internships: 45, hackathons: 35, research: 22, certifications: 40 },
    { category: "Applied", internships: 30, hackathons: 25, research: 15, certifications: 28 },
];

// KPI summary
const KPI = [
    { label: "Total Applicants", value: "2,450", change: "+18%", positive: true },
    { label: "Avg. Time to Hire", value: "14 days", change: "-3 days", positive: false },
    { label: "Offer Acceptance", value: "82%", change: "+5%", positive: true },
    { label: "Active Interns", value: "12", change: "+2", positive: true },
];

// ═══════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════

function getHeatmapColor(value: number): string {
    if (value >= 50) return "rgba(99, 102, 241, 0.9)";
    if (value >= 40) return "rgba(99, 102, 241, 0.7)";
    if (value >= 30) return "rgba(99, 102, 241, 0.5)";
    if (value >= 20) return "rgba(99, 102, 241, 0.3)";
    return "rgba(99, 102, 241, 0.15)";
}

const chartCardStyle: React.CSSProperties = {
    padding: "1.5rem",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
};

const chartTitleStyle: React.CSSProperties = {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "var(--md-sys-color-on-surface)",
    margin: 0,
};

const chartSubtitleStyle: React.CSSProperties = {
    fontSize: "0.8rem",
    color: "var(--md-sys-color-secondary)",
    margin: 0,
    marginTop: "-0.5rem",
};

// ═══════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════

export default function RecruiterAnalyticsPage() {
    const router = useRouter();
    const [kpiData, setKpiData] = useState(KPI);
    const [funnelData, setFunnelData] = useState(FUNNEL_DATA);

    useEffect(() => {
        const fetchAnalytics = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await fetch('http://127.0.0.1:8000/recruiter/analytics', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.kpi) setKpiData(data.kpi);
                        if (data.funnel) setFunnelData(data.funnel);
                    }
                } catch (e) {
                    console.error("Failed to fetch analytics", e);
                }
            }
        };
        fetchAnalytics();
    }, []);

    return (
        <main style={{ padding: "2rem 24px", maxWidth: "1400px", margin: "0 auto", minHeight: "100vh" }}>

            {/* ── Header ── */}
            <ScrollReveal width="100%">
                <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                        <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", margin: 0, lineHeight: 1.2 }}>
                            📊 Recruiter Analytics
                        </h1>
                        <p style={{ fontSize: "1.1rem", color: "var(--md-sys-color-secondary)", marginTop: "0.5rem" }}>
                            Data-driven insights across colleges, roles, and hiring funnels.
                        </p>
                    </div>
                    <Button variant="glass" onClick={() => router.push('/recruiter_dashboard')}>← Back to Dashboard</Button>
                </header>
            </ScrollReveal>

            {/* ── KPI Cards ── */}
            <ScrollReveal width="100%" delay={0.05}>
                <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
                    {kpiData.map((kpi: any, i: number) => (
                        <motion.div key={i} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
                            <Card variant="elevated" style={{ padding: "1.25rem" }}>
                                <h3 style={{ fontSize: "0.85rem", color: "var(--md-sys-color-secondary)", marginBottom: "0.4rem", fontWeight: 600 }}>{kpi.label}</h3>
                                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--md-sys-color-on-surface)" }}>{kpi.value}</div>
                                <div style={{ fontSize: "0.8rem", color: kpi.positive ? "#22c55e" : "#ef4444", marginTop: "0.25rem" }}>
                                    {kpi.positive ? "▲" : "▼"} {kpi.change}
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </section>
            </ScrollReveal>

            {/* ── Charts Grid ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 550px), 1fr))", gap: "1.5rem" }}>

                {/* ───────── 1. Heatmap ───────── */}
                <ScrollReveal width="100%" delay={0.1}>
                    <GlassContainer style={{ ...chartCardStyle, gridColumn: "1 / -1" }}>
                        <h3 style={chartTitleStyle}>🔥 College-Wise Shortlisting Heatmap</h3>
                        <p style={chartSubtitleStyle}>Shortlist % of students per college × job role</p>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "4px", minWidth: "500px" }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "0.8rem", color: "var(--md-sys-color-secondary)", fontWeight: 600 }}>College</th>
                                        {HEATMAP_ROLES.map(role => (
                                            <th key={role} style={{ padding: "8px 12px", fontSize: "0.8rem", color: "var(--md-sys-color-secondary)", fontWeight: 600, textAlign: "center" }}>{role}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {COLLEGES.map(college => (
                                        <tr key={college}>
                                            <td style={{ padding: "8px 12px", fontWeight: 600, fontSize: "0.9rem", whiteSpace: "nowrap" }}>{college}</td>
                                            {HEATMAP_ROLES.map(role => {
                                                const val = HEATMAP_DATA[college]?.[role] ?? 0;
                                                return (
                                                    <td key={role} style={{
                                                        textAlign: "center", padding: "12px 8px", borderRadius: "10px",
                                                        background: getHeatmapColor(val), color: val >= 40 ? "white" : "var(--md-sys-color-on-surface)",
                                                        fontWeight: 700, fontSize: "0.95rem",
                                                        transition: "transform 0.2s",
                                                    }}>
                                                        {val}%
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", fontSize: "0.75rem", color: "var(--md-sys-color-secondary)", marginTop: "0.5rem" }}>
                            <span>Low</span>
                            {[0.15, 0.3, 0.5, 0.7, 0.9].map((opacity, i) => (
                                <div key={i} style={{ width: "28px", height: "14px", borderRadius: "4px", background: `rgba(99, 102, 241, ${opacity})` }} />
                            ))}
                            <span>High</span>
                        </div>
                    </GlassContainer>
                </ScrollReveal>

                {/* ───────── 2. College-Wise Selection Rate ───────── */}
                <ScrollReveal width="100%" delay={0.15}>
                    <GlassContainer style={chartCardStyle}>
                        <h3 style={chartTitleStyle}>🏛️ College-Wise Selection Rate</h3>
                        <p style={chartSubtitleStyle}>Shortlisted vs Selected per college</p>
                        <div style={{ flex: 1, minHeight: "300px" }}>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={COLLEGE_SELECTION_DATA} barGap={4}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                                    <XAxis dataKey="college" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }} />
                                    <Legend />
                                    <Bar dataKey="shortlisted" name="Shortlisted" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="selected" name="Selected" fill="#22c55e" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassContainer>
                </ScrollReveal>

                {/* ───────── 3. Interview Funnel ───────── */}
                <ScrollReveal width="100%" delay={0.2}>
                    <GlassContainer style={chartCardStyle}>
                        <h3 style={chartTitleStyle}>🔽 Interview Funnel Conversion</h3>
                        <p style={chartSubtitleStyle}>Hiring pipeline efficiency</p>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem 0", gap: "1.5rem" }}>
                            {/* Pyramid */}
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0px", flex: 1, maxWidth: "420px" }}>
                                {funnelData.map((stage: any, i: number) => {
                                    const total = funnelData.length;
                                    const topWidthPct = 100 - (i / total) * 60;
                                    const bottomWidthPct = 100 - ((i + 1) / total) * 60;
                                    const leftTopInset = ((100 - topWidthPct) / 2).toFixed(1);
                                    const rightTopInset = (100 - (100 - topWidthPct) / 2).toFixed(1);
                                    const leftBottomInset = ((100 - bottomWidthPct) / 2).toFixed(1);
                                    const rightBottomInset = (100 - (100 - bottomWidthPct) / 2).toFixed(1);
                                    const clipPath = `polygon(${leftTopInset}% 0%, ${rightTopInset}% 0%, ${rightBottomInset}% 100%, ${leftBottomInset}% 100%)`;
                                    const conversionRate = i > 0 ? ((stage.value / funnelData[i - 1].value) * 100).toFixed(1) : null;

                                    return (
                                        <motion.div
                                            key={stage.name}
                                            initial={{ opacity: 0, scaleY: 0 }}
                                            animate={{ opacity: 1, scaleY: 1 }}
                                            transition={{ duration: 0.5, delay: i * 0.12, ease: "easeOut" }}
                                            style={{ width: "100%", position: "relative" }}
                                        >
                                            <div
                                                style={{
                                                    clipPath,
                                                    background: stage.fill,
                                                    padding: "18px 0",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    minHeight: "56px",
                                                    color: i < 3 ? "white" : "#312e81",
                                                    cursor: "default",
                                                    transition: "filter 0.2s",
                                                }}
                                            >
                                                <span style={{ fontWeight: 700, fontSize: "0.85rem", textAlign: "center", lineHeight: 1.2 }}>{stage.name}</span>
                                                <span style={{ fontWeight: 800, fontSize: "1.15rem", marginTop: "2px" }}>{stage.value.toLocaleString()}</span>
                                            </div>
                                            {conversionRate && (
                                                <div style={{
                                                    position: "absolute", right: "-70px", top: "50%", transform: "translateY(-50%)",
                                                    fontSize: "0.7rem", color: "var(--md-sys-color-secondary)", fontWeight: 600, whiteSpace: "nowrap"
                                                }}>
                                                    ← {conversionRate}%
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                        <div style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--md-sys-color-secondary)", fontWeight: 500 }}>
                            Overall conversion: <span style={{ fontWeight: 700, color: "var(--md-sys-color-primary)" }}>{((funnelData[funnelData.length - 1].value / funnelData[0].value) * 100).toFixed(1)}%</span>
                        </div>
                    </GlassContainer>
                </ScrollReveal>

                {/* ───────── 4. Role-Wise Selection % ───────── */}
                <ScrollReveal width="100%" delay={0.25}>
                    <GlassContainer style={chartCardStyle}>
                        <h3 style={chartTitleStyle}>💼 Role-Wise Selection %</h3>
                        <p style={chartSubtitleStyle}>Selection rate per job role</p>
                        <div style={{ flex: 1, minHeight: "300px" }}>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={ROLE_SELECTION_DATA} layout="vertical" barSize={20}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                                    <XAxis type="number" tick={{ fontSize: 12 }} unit="%" />
                                    <YAxis dataKey="role" type="category" tick={{ fontSize: 11 }} width={120} />
                                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }} formatter={(value: any) => [`${value}%`]} />
                                    <Bar dataKey="percentage" name="Selection %" fill="#6366f1" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassContainer>
                </ScrollReveal>

                {/* ───────── 5. Skill Availability vs Hiring Demand ───────── */}
                <ScrollReveal width="100%" delay={0.3}>
                    <GlassContainer style={chartCardStyle}>
                        <h3 style={chartTitleStyle}>⚡ Skill Supply vs Demand</h3>
                        <p style={chartSubtitleStyle}>% students with skill vs % actually hired</p>
                        <div style={{ flex: 1, minHeight: "300px" }}>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={SKILL_DEMAND_DATA} barGap={2}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                                    <XAxis dataKey="skill" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 12 }} unit="%" />
                                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }} formatter={(value: any) => [`${value}%`]} />
                                    <Legend />
                                    <Bar dataKey="students" name="Students with Skill %" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="hired" name="Hired %" fill="#f97316" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassContainer>
                </ScrollReveal>

                {/* ───────── 6. CGPA vs Selection Scatter ───────── */}
                <ScrollReveal width="100%" delay={0.35}>
                    <GlassContainer style={chartCardStyle}>
                        <h3 style={chartTitleStyle}>📈 CGPA vs Selection Outcome</h3>
                        <p style={chartSubtitleStyle}>Does CGPA correlate with hiring decisions?</p>
                        <div style={{ flex: 1, minHeight: "300px" }}>
                            <ResponsiveContainer width="100%" height={300}>
                                <ScatterChart>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                                    <XAxis dataKey="cgpa" name="CGPA" type="number" domain={[6, 10]} tick={{ fontSize: 12 }} />
                                    <YAxis dataKey="score" name="Match Score" tick={{ fontSize: 12 }} />
                                    <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }} />
                                    <Legend />
                                    <Scatter
                                        name="Selected"
                                        data={SCATTER_DATA.filter(d => d.selected)}
                                        fill="#22c55e"
                                        shape="circle"
                                    />
                                    <Scatter
                                        name="Not Selected"
                                        data={SCATTER_DATA.filter(d => !d.selected)}
                                        fill="#ef4444"
                                        shape="diamond"
                                    />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassContainer>
                </ScrollReveal>

                {/* ───────── 7. Institution Talent Quality Index ───────── */}
                <ScrollReveal width="100%" delay={0.4}>
                    <GlassContainer style={chartCardStyle}>
                        <h3 style={chartTitleStyle}>🏆 Institution Talent Quality Index</h3>
                        <p style={chartSubtitleStyle}>Composite score: shortlist rate, selection rate, skill match</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1, justifyContent: "center" }}>
                            {QUALITY_INDEX_DATA.map((item, i) => (
                                <div key={item.college} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                    <span style={{ fontSize: "1.2rem", width: "28px", textAlign: "center" }}>
                                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "4️⃣"}
                                    </span>
                                    <span style={{ fontWeight: 600, fontSize: "0.9rem", width: "90px", whiteSpace: "nowrap" }}>{item.college}</span>
                                    <div style={{ flex: 1, background: "var(--md-sys-color-surface-variant)", borderRadius: "10px", height: "28px", overflow: "hidden" }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.score}%` }}
                                            transition={{ duration: 1, delay: 0.3 + i * 0.15, ease: "easeOut" }}
                                            style={{
                                                height: "100%", borderRadius: "10px",
                                                background: i === 0 ? "linear-gradient(90deg, #6366f1, #8b5cf6)" :
                                                    i === 1 ? "linear-gradient(90deg, #8b5cf6, #a78bfa)" :
                                                        i === 2 ? "linear-gradient(90deg, #a78bfa, #c4b5fd)" : "#c4b5fd",
                                                display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: "10px"
                                            }}
                                        >
                                            <span style={{ color: "white", fontWeight: 700, fontSize: "0.8rem" }}>{item.score}</span>
                                        </motion.div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassContainer>
                </ScrollReveal>

                {/* ───────── 8. Degree Distribution ───────── */}
                <ScrollReveal width="100%" delay={0.45}>
                    <GlassContainer style={chartCardStyle}>
                        <h3 style={chartTitleStyle}>🎓 Degree Distribution</h3>
                        <p style={chartSubtitleStyle}>Hires by degree type</p>
                        <div style={{ flex: 1, minHeight: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={DEGREE_DATA}
                                        cx="50%" cy="50%"
                                        innerRadius={60} outerRadius={110}
                                        paddingAngle={3}
                                        dataKey="value"
                                        label={({ name, value }: any) => `${name} ${value}%`}
                                        labelLine={false}
                                    >
                                        {DEGREE_DATA.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={DEGREE_COLORS[index % DEGREE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }} formatter={(value: any) => [`${value}%`]} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassContainer>
                </ScrollReveal>

                {/* ───────── 9. Hiring Trend Over Time ───────── */}
                <ScrollReveal width="100%" delay={0.5}>
                    <GlassContainer style={chartCardStyle}>
                        <h3 style={chartTitleStyle}>📅 Hiring Trend Over Time</h3>
                        <p style={chartSubtitleStyle}>Month-wise selections and hiring season peaks</p>
                        <div style={{ flex: 1, minHeight: "300px" }}>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={HIRING_TREND_DATA}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }} />
                                    <Line
                                        type="monotone" dataKey="selections" name="Selections"
                                        stroke="#6366f1" strokeWidth={3} dot={{ r: 5, fill: "#6366f1" }}
                                        activeDot={{ r: 7, fill: "#8b5cf6" }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassContainer>
                </ScrollReveal>

                {/* ───────── 10. Activity Impact Analysis ───────── */}
                <ScrollReveal width="100%" delay={0.55}>
                    <GlassContainer style={chartCardStyle}>
                        <h3 style={chartTitleStyle}>🎯 Activity Impact Analysis</h3>
                        <p style={chartSubtitleStyle}>Co-curricular activities of selected candidates</p>
                        <div style={{ flex: 1, minHeight: "300px" }}>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={ACTIVITY_IMPACT_DATA} barSize={32}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                                    <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} unit="%" />
                                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }} formatter={(value: any) => [`${value}%`]} />
                                    <Legend />
                                    <Bar dataKey="internships" name="Internships" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="hackathons" name="Hackathons" stackId="a" fill="#8b5cf6" />
                                    <Bar dataKey="research" name="Research Papers" stackId="a" fill="#a78bfa" />
                                    <Bar dataKey="certifications" name="Certifications" stackId="a" fill="#c4b5fd" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassContainer>
                </ScrollReveal>

            </div>

        </main>
    );
}
