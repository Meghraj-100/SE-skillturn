"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { GlassContainer } from "@/components/ui/GlassContainer";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Link from "next/link";

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '4rem', paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <ScrollReveal width="100%">
        <section style={{
          position: 'relative',
          height: '90vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 50% 50%, var(--md-sys-color-primary-container) 0%, var(--md-sys-color-background) 70%)',
          overflow: 'hidden'
        }}>
          {/* Background Orbs */}
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: '300px',
            height: '300px',
            background: 'var(--md-sys-color-tertiary-container)',
            borderRadius: '50%',
            filter: 'blur(80px)',
            opacity: 0.6
          }} />
          <div style={{
            position: 'absolute',
            bottom: '20%',
            right: '10%',
            width: '400px',
            height: '400px',
            background: 'var(--md-sys-color-secondary-container)',
            borderRadius: '50%',
            filter: 'blur(100px)',
            opacity: 0.6
          }} />

          <GlassContainer style={{ maxWidth: '800px', width: '90%', textAlign: 'center', zIndex: 1 }}>
            <h1 style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: 800,
              marginBottom: '1.5rem',
              background: 'linear-gradient(45deg, var(--md-sys-color-primary), var(--md-sys-color-tertiary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Find Your Next Academic Adventure
            </h1>
            <p style={{
              fontSize: '1.25rem',
              color: 'var(--md-sys-color-on-surface)',
              marginBottom: '2.5rem',
              lineHeight: 1.6
            }}>
              Connect with faculty and companies for cutting-edge projects and internships.
              Track your applications and build your future.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/opportunities">
                <Button variant="filled" style={{ fontSize: '1.1rem', padding: '0 32px', height: '48px' }}>
                  Explore Opportunities
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outlined" style={{ fontSize: '1.1rem', padding: '0 32px', height: '48px' }}>
                  Manage Applications
                </Button>
              </Link>
            </div>
          </GlassContainer>
        </section>
      </ScrollReveal>

      {/* Features Section */}
      <ScrollReveal width="100%" delay={0.2}>
        <section style={{ padding: '0 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '2.5rem',
            marginBottom: '3rem',
            color: 'var(--md-sys-color-on-surface)'
          }}>
            Why use SkillTurn?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <Card variant="elevated">
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--md-sys-color-primary)' }}>Smart Matching</h3>
              <p style={{ lineHeight: 1.6 }}>
                Our system recommends projects based on your skills and interests, ensuring you find the perfect fit for your academic growth.
              </p>
            </Card>
            <Card variant="elevated">
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--md-sys-color-primary)' }}>Easy Tracking</h3>
              <p style={{ lineHeight: 1.6 }}>
                Keep track of all your applications in one place. Get real-time status updates and never miss a deadline.
              </p>
            </Card>
            <Card variant="elevated">
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--md-sys-color-primary)' }}>Direct Connection</h3>
              <p style={{ lineHeight: 1.6 }}>
                Connect directly with professors and industry mentors. Ask questions and get feedback on your proposals.
              </p>
            </Card>
          </div>
        </section>
      </ScrollReveal>
    </main>
  );
}
