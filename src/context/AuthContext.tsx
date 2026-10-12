"use client";

import React, { createContext, useContext, useState } from "react";

export type Role = "student" | "faculty" | "recruiter" | null;

export interface User {
  id: string;
  username?: string;
  name?: string;
  full_name?: string;
  email: string;
  role: Exclude<Role, null>;
  avatarUrl?: string;
  title?: string;
}

export interface Student extends User {
  collegeName?: string;
  degree?: string;
  branch?: string;
  yearsOfStudy?: number;
  expectedGraduationYear?: number;
  rollNumber?: string;
  collegeEmail?: string;
  gpa?: number;
}

export interface Faculty extends User {
  institution?: string;
  department?: string;
  designation?: string;
  profileLink?: string;
  experience?: number;
}

const MOCK_USERS: Record<Exclude<Role, null>, User> = {
  student: {
    id: "usr_student_1",
    username: "alexrivera",
    name: "Alex Rivera",
    full_name: "Alex Rivera",
    email: "alex.rivera@university.edu",
    role: "student",
    title: "Computer Science Senior",
  },
  faculty: {
    id: "usr_faculty_1",
    username: "sarahchen",
    name: "Dr. Sarah Chen",
    full_name: "Dr. Sarah Chen",
    email: "sarah.chen@university.edu",
    role: "faculty",
    title: "Professor of AI & Robotics",
  },
  recruiter: {
    id: "usr_recruiter_1",
    username: "marcusvance",
    name: "Marcus Vance",
    full_name: "Marcus Vance",
    email: "marcus.vance@techcorp.io",
    role: "recruiter",
    title: "Lead Tech Recruiter",
  },
};

interface AuthContextType {
  user: User | null;
  role: Role;
  setRole: (role: Role) => void;
  login: (role: Exclude<Role, null>) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("student");
  const [user, setUser] = useState<User | null>(MOCK_USERS.student);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    if (newRole) {
      setUser(MOCK_USERS[newRole]);
    } else {
      setUser(null);
    }
  };

  const login = (roleToLogin: Exclude<Role, null>) => {
    setRole(roleToLogin);
  };

  const logout = () => {
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        setRole,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
