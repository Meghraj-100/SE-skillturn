"use client";
import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";

export default function FacultyForm() {
  const [form, setForm] = useState({
    institution: "",
    department: "",
    designation: "",
    email: "",
    profileLink: "",
    experience: "",
  });
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    for (const [k, v] of Object.entries(form)) {
      if (!v) {
        setError("Please fill all required fields.");
        return;
      }
    }
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please login.");
        return;
      }

      const response = await fetch("http://localhost:8000/faculty/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: "temp", // Overwritten by backend
          institute: form.institution,
          department: form.department,
          designation: form.designation,
          official_email: form.email,
          years_of_experience: parseInt(form.experience) || 0,
          profile_link: form.profileLink
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create profile");
      }

      // Redirect to faculty dashboard
      window.location.href = "/facultydash";
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <FormInput
        label="Institution Name"
        name="institution"
        required
        value={form.institution}
        onChange={handleChange}
      />
      <FormInput
        label="Department"
        name="department"
        required
        value={form.department}
        onChange={handleChange}
      />
      <FormInput
        label="Designation (Professor, Assistant Prof, Lecturer)"
        name="designation"
        required
        value={form.designation}
        onChange={handleChange}
      />
      <FormInput
        type="email"
        label="Official Email ID"
        name="email"
        required
        value={form.email}
        onChange={handleChange}
      />
      <FormInput
        label="Faculty Profile Page Link"
        name="profileLink"
        required
        value={form.profileLink}
        onChange={handleChange}
      />
      <FormInput
        label="Years of Experience"
        name="experience"
        type="number"
        min="0"
        required
        value={form.experience}
        onChange={handleChange}
      />
      {error && (
        <div
          style={{ color: "var(--md-sys-color-error)", marginBottom: 10 }}
        >
          {error}
        </div>
      )}
      <Button
        type="submit"
        variant="filled"
        style={{ width: "100%", marginTop: 8 }}
      >
        Submit
      </Button>
    </form>

  );
}
