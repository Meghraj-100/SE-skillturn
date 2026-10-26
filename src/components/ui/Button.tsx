"use client";

import React from 'react';
import styles from './Button.module.css';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<"button"> {
    variant?: 'filled' | 'outlined' | 'text' | 'glass';
    children: React.ReactNode;
}

export const Button = ({
    variant = 'filled',
    children,
    className = '',
    disabled,
    ...props
}: ButtonProps) => {
    return (
        <motion.button
            className={`${styles.button} ${styles[variant]} ${className}`}
            whileHover={disabled ? undefined : { scale: 1.05 }}
            whileTap={disabled ? undefined : { scale: 0.95 }}
            disabled={disabled}
            suppressHydrationWarning
            {...props}
        >
            {children}
        </motion.button>
    );
};
