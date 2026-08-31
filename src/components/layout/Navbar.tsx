"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./Navbar.module.css";
import { Button } from "../ui/Button";
import { ThemeToggle } from "../ui/ThemeToggle";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  // user?.role = "student"

  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  return (
    <>
      <nav className={styles.navbar}>
        <Link href="/" className={styles.logo}>
          SkillTurn
        </Link>

        <div className={styles.navLinks}>
          {user?.role == "student" && (
            <Link href="/opportunities">
              <motion.div
                className={styles.liquidLink}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Opportunities
              </motion.div>
            </Link>
          )}
          {user?.role == "faculty" && (
            <Link href="/facultyprofile">
              <motion.div
                className={styles.liquidLink}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Profile
              </motion.div>
            </Link>
          )}
          {user?.role == "recruiter" && (
            <Link href="/r-posted_jobs">
              <motion.div
                className={styles.liquidLink}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Posted Jobs
              </motion.div>
            </Link>
          )}
          {user?.role == "faculty" && (
            <Link href="/facultydash">
              <motion.div
                className={styles.liquidLink}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Dashboard
              </motion.div>
            </Link>
          )}
          {user?.role == "recruiter" && (
            <Link href="/recruiter_dashboard">
              <motion.div
                className={styles.liquidLink}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Dashboard
              </motion.div>
            </Link>
          )}
          {user?.role == "student" && (
            <Link href="/dashboard">
              <motion.div
                className={styles.liquidLink}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Dashboard
              </motion.div>
            </Link>
          )}
          {!user && (
            <Link href="/dashboard">
              <motion.div
                className={styles.liquidLink}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Dashboard
              </motion.div>
            </Link>
          )}
          {!user && (
            <Link href="/opportunities">
              <motion.div
                className={styles.liquidLink}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Opportunities
              </motion.div>
            </Link>
          )}
          <ThemeToggle />
          {user ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                }}
                onClick={() => {
                  switch (user.role) {
                    case "student":
                      router.push("/dashboard");
                      break;
                    case "faculty":
                      router.push("/facultyprofile");
                      break;
                    case "recruiter":
                      router.push("/recruiter_dashboard");
                      break;
                  }
                }}
                title="visit profile"
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "var(--md-sys-color-primary)",
                    color: "var(--md-sys-color-on-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: "1.2rem",
                  }}
                >
                  {getInitials(user.full_name)}
                </div>
              </div>
              <Button
                variant="outlined"
                onClick={logout}
                style={{ marginLeft: "10px" }}
              >
                Logout
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="filled">Login</Button>
            </Link>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div className={styles.mobileThemeToggle}>
            <ThemeToggle />
          </div>
          <motion.button
            className={styles.mobileMenuBtn}
            onClick={toggleMenu}
            aria-label="Toggle menu"
            whileTap={{ scale: 0.9 }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 12H21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                suppressHydrationWarning
              />
              <path
                d="M3 6H21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                suppressHydrationWarning
              />
              <path
                d="M3 18H21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                suppressHydrationWarning
              />
            </svg>
          </motion.button>
        </div>
      </nav>

      <div
        className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.open : ""
          }`}
      >
        {user?.role == "student" && (
          <Link
            href="/opportunities"
            className={styles.liquidLink}
            onClick={toggleMenu}
          >
            Opportunities
          </Link>
        )}
        {user?.role == "faculty" && (
          <Link
            href="/facultyprofile"
            className={styles.liquidLink}
            onClick={toggleMenu}
          >
            Profile
          </Link>
        )}
        {user?.role == "recruiter" && (
          <Link
            href="/r-posted_jobs"
            className={styles.liquidLink}
            onClick={toggleMenu}
          >
            posted_jobs
          </Link>
        )}
        {user?.role == "faculty" && (
          <Link
            href="/facultydash"
            className={styles.liquidLink}
            onClick={toggleMenu}
          >
            Dashboard
          </Link>
        )}
        {user?.role == "recruiter" && (
          <Link
            href="/recruiter_dashboard"
            className={styles.liquidLink}
            onClick={toggleMenu}
          >
            Dashboard
          </Link>
        )}
        {user?.role == "student" && (
          <Link
            href="/dashboard"
            className={styles.liquidLink}
            onClick={toggleMenu}
          >
            Dashboard
          </Link>
        )}
        {!user && (
          <Link
            href="/dashboard"
            className={styles.liquidLink}
            onClick={toggleMenu}
          >
            Dashboard
          </Link>
        )}
        {!user && (
          <Link
            href="/opportunities"
            className={styles.liquidLink}
            onClick={toggleMenu}
          >
            Opportunities
          </Link>
        )}
        <ThemeToggle />
        {user ? (
          <>
            <div
              onClick={() => {
                logout();
                toggleMenu();
              }}
              style={{
                cursor: "pointer",
                textAlign: "center",
                padding: "10px",
                color: "var(--md-sys-color-error)",
              }}
            >
              Logout
            </div>
            <div
              onClick={() => {
                switch (user.role) {
                  case "student":
                    router.push("/dashboard");
                    break;
                  case "faculty":
                    router.push("/facultyprofile");
                    break;
                  case "recruiter":
                    router.push("/recruiter_dashboard");
                    break;
                }
                toggleMenu();
              }}
              style={{
                cursor: "pointer",
                textAlign: "center",
                padding: "10px",
              }}
            >
              ({user.username})
            </div>
          </>
        ) : (
          <Link href="/login" onClick={toggleMenu}>
            <Button variant="filled" style={{ width: "100%" }}>
              Login
            </Button>
          </Link>
        )}
      </div>
    </>
  );
};
