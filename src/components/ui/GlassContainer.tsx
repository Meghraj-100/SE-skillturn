import React from 'react';
import styles from './GlassContainer.module.css';

interface GlassContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export const GlassContainer = ({
    children,
    className = '',
    ...props
}: GlassContainerProps) => {
    return (
        <div
            className={`${styles.glassContainer} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};
