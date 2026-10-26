"use client";
import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";

export default function RecruiterForm() {
  const [form, setForm] = useState({
    fullName: "",
    companyId: "",
    companyName: "",
    jobTitle: "",
    workEmail: "",
    companyWeb: "",
    companySize: "",
    domains: "",
    linkedin: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function isAllowedWorkEmail(email: string) {
    if (!email) return false;
    const blocked = [/gmail\.com$/i, /yahoo\.com$/i];
    return !blocked.some((re) => re.test(email));
  }
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("RecruiterForm: Submission started", form);

    if (
      !(
        form.fullName &&
        form.companyName &&
        form.jobTitle &&
        form.workEmail &&
        form.companyWeb
      )
    ) {
      setError("Please fill all required fields.");
      return;
    }
    if (!isAllowedWorkEmail(form.workEmail)) {
      setError("Please use your work email (Gmail/Yahoo not allowed)");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      console.log("RecruiterForm: Token present:", !!token);

      if (!token) {
        setError("No authentication token found. Please login.");
        setIsLoading(false);
        return;
      }

      const payload = {
        user_id: "temp",
        full_name: form.fullName,
        company_id: form.companyId || null,
        company_name: form.companyName,
        designation: form.jobTitle,
        work_email: form.workEmail,
        company_website: form.companyWeb,
        company_size: form.companySize || null,
        hiring_domain: form.domains || null,
        linkedin_profile: form.linkedin || null
      };

      console.log("RecruiterForm: Sending request to http://127.0.0.1:8000/recruiter/profile");
      const response = await fetch("http://127.0.0.1:8000/recruiter/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      console.log("RecruiterForm: Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("RecruiterForm: Server Error:", errorData);
        throw new Error(errorData.detail || "Failed to create profile");
      }

      console.log("RecruiterForm: Success, redirecting...");
      window.location.href = "/recruiter_dashboard";
    } catch (err: any) {
      console.error("RecruiterForm: Caught Exception:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <FormInput
        label="Full name"
        name="fullName"
        required
        value={form.fullName}
        onChange={handleChange}
      />
      <FormInput
        label="Company ID (required if known)"
        name="companyId"
        value={form.companyId}
        onChange={handleChange}
        placeholder="Enter Company ID if you have it"
      />
      <FormInput
        label="Company name"
        name="companyName"
        required
        value={form.companyName}
        onChange={handleChange}
      />
      <FormInput
        label="Job title (HR, Founder, Recruiter)"
        name="jobTitle"
        required
        value={form.jobTitle}
        onChange={handleChange}
      />
      <FormInput
        type="email"
        label="Work email"
        name="workEmail"
        required
        value={form.workEmail}
        onChange={handleChange}
        error={
          form.workEmail && !isAllowedWorkEmail(form.workEmail)
            ? "Please use your work email."
            : undefined
        }
      />
      <FormInput
        label="Company website or LinkedIn"
        name="companyWeb"
        required
        value={form.companyWeb}
        onChange={handleChange}
      />
      <FormInput
        label="Company size (optional)"
        name="companySize"
        value={form.companySize}
        onChange={handleChange}
      />
      <FormInput
        label="Hiring domains (optional - Tech, Sales, Core, etc.)"
        name="domains"
        value={form.domains}
        onChange={handleChange}
      />
      <FormInput
        label="LinkedIn profile (optional)"
        name="linkedin"
        value={form.linkedin}
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
        disabled={isLoading}
        style={{ width: "100%", marginTop: 8 }}
      >
        {isLoading ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
}
