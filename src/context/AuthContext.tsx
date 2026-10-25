"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
    id: string;
    username: string;
    email: string;
    full_name: string;
    role: "student" | "faculty" | "admin" | "recruiter";
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
}

export interface Student extends User {
    collegeName: string;
    degree: string;
    branch: string;
    yearsOfStudy: number;
    expectedGraduationYear: number;
    rollNumber: string;
    collegeEmail: string;
}

export interface Faculty extends User {
    institution: string;
    department: string;
    designation: string;
    profileLink: string;
    experience: number;
}

interface RegisterData {
    username: string;
    email: string;
    full_name: string;
    password: string;
    role: "student" | "faculty" | "admin" | "recruiter";
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<User>;
    register: (data: RegisterData) => Promise<User>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const API_URL = 'http://127.0.0.1:8000';

    const fetchUser = async (token: string): Promise<User | null> => {
        try {
            const response = await fetch(`${API_URL}/users/me/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                return userData;
            } else {
                logout();
                return null;
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
            logout();
            return null;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser(token);
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (username: string, password: string): Promise<User> => {
        // OAuth2PasswordRequestForm expects x-www-form-urlencoded data
        const formData = new URLSearchParams();
        formData.append('grant_type', 'password');
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch(`${API_URL}/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }

        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        const userData = await fetchUser(data.access_token);
        if (!userData) throw new Error('Failed to fetch user data');
        return userData;
    };

    const register = async (data: RegisterData): Promise<User> => {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Registration failed');
        }
        
        // After successful registration, log the user in automatically
        return await login(data.username, data.password);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
