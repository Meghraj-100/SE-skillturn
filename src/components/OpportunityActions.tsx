"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/Button";

interface OpportunityActionsProps {
    opportunityId: string;
}

export const OpportunityActions: React.FC<OpportunityActionsProps> = ({ opportunityId }) => {
    const [applyStatus, setApplyStatus] = useState<'idle' | 'loading' | 'applied' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleApply = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setMessage('Please log in to apply.');
            return;
        }

        setApplyStatus('loading');
        setMessage('');
        try {
            const res = await fetch('http://127.0.0.1:8000/student/apply', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    job_id: opportunityId,
                    user_id: "placeholder"
                })
            });

            if (res.ok) {
                setApplyStatus('applied');
                setMessage('✅ Application submitted successfully!');
            } else {
                const err = await res.json().catch(() => null);
                const detail = err?.detail || `Error (${res.status})`;
                setApplyStatus('error');
                setMessage(`❌ ${detail}`);
            }
        } catch (e) {
            setApplyStatus('error');
            setMessage('❌ Network error — could not reach server.');
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                <Button
                    variant="filled"
                    onClick={handleApply}
                    disabled={applyStatus === 'loading' || applyStatus === 'applied'}
                >
                    {applyStatus === 'loading' ? 'Applying...' : applyStatus === 'applied' ? '✓ Applied' : 'Apply Now'}
                </Button>
            </div>
            {message && (
                <p style={{
                    textAlign: 'right',
                    marginTop: '0.75rem',
                    fontSize: '0.9rem',
                    color: message.startsWith('✅') ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-error)'
                }}>
                    {message}
                </p>
            )}
        </div>
    );
};
