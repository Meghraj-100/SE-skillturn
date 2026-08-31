"use client";

import React from 'react';
import styles from './Card.module.css';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<"div"> {
    variant?: 'elevated' | 'outlined' | 'filled';
    children: React.ReactNode;
}

export const Card = ({
    variant = 'elevated',
    children,
    className = '',
    ...props
}: CardProps) => {
    return (
        <motion.div
            className={`${styles.card} ${styles[variant]} ${className}`}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            {...props}
        >
            {children}
        </motion.div>
    );
};
