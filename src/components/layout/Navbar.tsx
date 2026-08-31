"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, Role } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface NavItem {
  label: string;
  href: string;
}

export function Navbar() {
  const pathname = usePathname();
  const { user, role, setRole, logout, login } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // Define role-specific navigation links
  const commonLinks: NavItem[] = [
    { label: "Home", href: "/" },
    { label: "Opportunities", href: "/opportunities" },
  ];

  const roleLinks: Record<Exclude<Role, null>, NavItem[]> = {
    student: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Applications", href: "/applications" },
      { label: "Saved Projects", href: "/saved" },
    ],
    faculty: [
      { label: "Faculty Portal", href: "/faculty" },
      { label: "Post Project", href: "/projects/new" },
      { label: "Review Apps", href: "/reviews" },
    ],
    recruiter: [
      { label: "Recruiter Hub", href: "/recruiter" },
      { label: "Post Internship", href: "/internships/new" },
      { label: "Talent Pool", href: "/talent" },
    ],
  };

  const currentNavItems = [
    ...commonLinks,
    ...(role ? roleLinks[role] : []),
  ];

  const rolesList: { id: Role; label: string }[] = [
    { id: "student", label: "Student" },
    { id: "faculty", label: "Faculty" },
    { id: "recruiter", label: "Recruiter" },
    { id: null, label: "Guest (Logged Out)" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-nav transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-[var(--md-sys-color-primary)] via-purple-500 to-[var(--md-sys-color-tertiary)] bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
              SkillTurn
            </span>
            {role && (
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[var(--liquid-bg)] border border-[var(--liquid-border)] text-[var(--md-sys-color-primary)]">
                {role}
              </span>
            )}
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {currentNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? "text-[var(--md-sys-color-primary)] font-semibold"
                      : "text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--liquid-hover-bg)]"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-full bg-[var(--liquid-bg)] border border-[var(--liquid-border)] -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="hidden md:flex items-center gap-3">
            {/* Role Quick-Switcher Menu */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--liquid-bg)] border border-[var(--liquid-border)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--liquid-hover-bg)] transition-all cursor-pointer"
                title="Switch test user role"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Role: {role ? role : "Guest"}</span>
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${roleDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <AnimatePresence>
                {roleDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 rounded-xl glass p-1.5 shadow-xl border border-[var(--glass-border)] z-50"
                  >
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-secondary)]">
                      Mock Role Switcher
                    </div>
                    {rolesList.map((r) => (
                      <button
                        key={r.id ?? "guest"}
                        onClick={() => {
                          setRole(r.id);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                          role === r.id
                            ? "bg-[var(--liquid-hover-bg)] text-[var(--md-sys-color-primary)] font-semibold"
                            : "hover:bg-[var(--liquid-hover-bg)] text-[var(--md-sys-color-on-surface)]"
                        }`}
                      >
                        <span>{r.label}</span>
                        {role === r.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-primary)]" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden xl:block">
                  <p className="text-xs font-semibold leading-none">{user.name}</p>
                  <p className="text-[10px] text-[var(--md-sys-color-secondary)] leading-tight">{user.email}</p>
                </div>
                <Button variant="outlined" className="h-9 px-4 text-xs" onClick={logout}>
                  Log Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="text" className="h-9 px-3 text-xs" onClick={() => login("student")}>
                  Log In
                </Button>
                <Button variant="filled" className="h-9 px-4 text-xs" onClick={() => login("student")}>
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-[var(--liquid-bg)] border border-[var(--liquid-border)] text-[var(--md-sys-color-on-surface)] focus:outline-none"
              aria-label="Toggle Mobile Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-[var(--glass-border)] glass"
          >
            <div className="px-4 pt-3 pb-6 space-y-3">
              {/* Role Switcher in Mobile Drawer */}
              <div className="p-3 rounded-xl bg-[var(--liquid-bg)] border border-[var(--liquid-border)]">
                <p className="text-xs font-semibold text-[var(--md-sys-color-secondary)] mb-2">Select Active Role (Testing):</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {rolesList.map((r) => (
                    <button
                      key={r.id ?? "guest"}
                      onClick={() => setRole(r.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-center ${
                        role === r.id
                          ? "bg-[var(--md-sys-color-primary)] text-white font-semibold"
                          : "bg-black/5 dark:bg-white/5 text-[var(--md-sys-color-on-surface)]"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div className="flex flex-col space-y-1">
                {currentNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-[var(--liquid-hover-bg)] text-[var(--md-sys-color-primary)] font-semibold"
                          : "text-[var(--md-sys-color-on-surface)] hover:bg-[var(--liquid-hover-bg)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {/* User / Auth Info */}
              <div className="pt-2 border-t border-[var(--glass-border)] flex items-center justify-between">
                {user ? (
                  <>
                    <div>
                      <p className="text-xs font-semibold">{user.name}</p>
                      <p className="text-[10px] text-[var(--md-sys-color-secondary)]">{user.email}</p>
                    </div>
                    <Button variant="outlined" className="h-8 px-3 text-xs" onClick={logout}>
                      Log Out
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 w-full">
                    <Button variant="outlined" className="w-1/2 h-9 text-xs" onClick={() => login("student")}>
                      Log In
                    </Button>
                    <Button variant="filled" className="w-1/2 h-9 text-xs" onClick={() => login("student")}>
                      Sign Up
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
