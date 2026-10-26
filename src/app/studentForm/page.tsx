"use client";

import { Button } from "@/components/ui/Button";
import { GlassContainer } from "@/components/ui/GlassContainer";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StudentFormPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    collegeName: "",
    degree: "",
    branch: "",
    yearOfStudy: "",
    expectedGraduationYear: "",
    rollNumber: "",
    collegeEmail: "",
    gpa: "",
  });

  const degrees = [
    "BTech",
    "MTech",
    "BSc",
    "MSc",
    "BA",
    "MA",
    "BBA",
    "MBA",
    "BE",
    "ME",
    "Other",
  ];
  const years = ["1st", "2nd", "3rd", "4th", "5th"];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateEmail = (email: string): boolean => {
    const validDomains = [".edu", ".ac.in", ".edu.in", ".ac.uk", ".edu.au"];
    return validDomains.some((domain) => email.toLowerCase().endsWith(domain));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.collegeName.trim()) {
      newErrors.collegeName = "College/University name is required";
    }

    if (!formData.degree) {
      newErrors.degree = "Degree is required";
    }

    if (!formData.branch.trim()) {
      newErrors.branch = "Branch/Major is required";
    }

    if (!formData.yearOfStudy) {
      newErrors.yearOfStudy = "Year of study is required";
    }

    if (!formData.expectedGraduationYear.trim()) {
      newErrors.expectedGraduationYear = "Expected graduation year is required";
    } else {
      const year = parseInt(formData.expectedGraduationYear);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < currentYear || year > currentYear + 10) {
        newErrors.expectedGraduationYear =
          "Please enter a valid graduation year";
      }
    }

    if (!formData.rollNumber.trim()) {
      newErrors.rollNumber = "Roll number/Enrollment ID is required";
    }

    if (!formData.collegeEmail.trim()) {
      newErrors.collegeEmail = "College email is required";
    } else if (!validateEmail(formData.collegeEmail)) {
      newErrors.collegeEmail =
        "Email must end with .edu, .ac.in, or similar educational domain";
    }

    if (!formData.gpa.trim()) {
      newErrors.gpa = "GPA / CGPA is required";
    } else {
      const gpaNum = parseFloat(formData.gpa);
      if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 10) {
        newErrors.gpa = "Please enter a valid GPA between 0.0 and 10.0";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please login.");
      }

      const response = await fetch("http://127.0.0.1:8000/student/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: "temp", // Required by Pydantic, overwritten by backend
          college: formData.collegeName,
          degree: formData.degree,
          branch: formData.branch,
          year_of_study: parseInt(formData.yearOfStudy) || 1,
          expected_graduation_year: parseInt(formData.expectedGraduationYear),
          roll_no: formData.rollNumber,
          college_email: formData.collegeEmail,
          gpa: parseFloat(formData.gpa) || 0.0,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = "Failed to submit profile";
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((err: any) => `${err.loc.join(".")}: ${err.msg}`).join("\n");
          } else {
            errorMessage = errorData.detail;
          }
        }
        throw new Error(errorMessage);
      }

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error submitting form:", error);
      alert(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <GlassContainer
        style={{ maxWidth: "600px", width: "100%", padding: "40px" }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "2rem",
              marginBottom: "0.5rem",
              fontWeight: 700,
            }}
          >
            Student Registration
          </h1>
          <p style={{ color: "var(--md-sys-color-secondary)" }}>
            Please fill in your academic details
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          <div>
            <label
              htmlFor="collegeName"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              College / University name{" "}
              <span style={{ color: "var(--md-sys-color-error)" }}>*</span>
            </label>
            <input
              id="collegeName"
              name="collegeName"
              type="text"
              placeholder="Enter your college/university name"
              required
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: errors.collegeName
                  ? "1px solid var(--md-sys-color-error)"
                  : "1px solid var(--input-border)",
                background: "var(--input-background)",
                color: "var(--input-color)",
                fontSize: "1rem",
              }}
              value={formData.collegeName}
              onChange={handleChange}
            />
            {errors.collegeName && (
              <p
                style={{
                  color: "var(--md-sys-color-error)",
                  fontSize: "0.875rem",
                  marginTop: "0.25rem",
                }}
              >
                {errors.collegeName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="degree"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              Degree{" "}
              <span style={{ color: "var(--md-sys-color-error)" }}>*</span>
            </label>
            <select
              id="degree"
              name="degree"
              required
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: errors.degree
                  ? "1px solid var(--md-sys-color-error)"
                  : "1px solid var(--input-border)",
                background: "var(--input-background)",
                color: "var(--input-color)",
                fontSize: "1rem",
                cursor: "pointer",
              }}
              value={formData.degree}
              onChange={handleChange}
            >
              <option value="">Select degree</option>
              {degrees.map((degree) => (
                <option key={degree} value={degree}>
                  {degree}
                </option>
              ))}
            </select>
            {errors.degree && (
              <p
                style={{
                  color: "var(--md-sys-color-error)",
                  fontSize: "0.875rem",
                  marginTop: "0.25rem",
                }}
              >
                {errors.degree}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="branch"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              Branch / Major{" "}
              <span style={{ color: "var(--md-sys-color-error)" }}>*</span>
            </label>
            <input
              id="branch"
              name="branch"
              type="text"
              placeholder="e.g., Computer Science, Electrical Engineering"
              required
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: errors.branch
                  ? "1px solid var(--md-sys-color-error)"
                  : "1px solid var(--input-border)",
                background: "var(--input-background)",
                color: "var(--input-color)",
                fontSize: "1rem",
              }}
              value={formData.branch}
              onChange={handleChange}
            />
            {errors.branch && (
              <p
                style={{
                  color: "var(--md-sys-color-error)",
                  fontSize: "0.875rem",
                  marginTop: "0.25rem",
                }}
              >
                {errors.branch}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="yearOfStudy"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              Year of study{" "}
              <span style={{ color: "var(--md-sys-color-error)" }}>*</span>
            </label>
            <select
              id="yearOfStudy"
              name="yearOfStudy"
              required
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: errors.yearOfStudy
                  ? "1px solid var(--md-sys-color-error)"
                  : "1px solid var(--input-border)",
                background: "var(--input-background)",
                color: "var(--input-color)",
                fontSize: "1rem",
                cursor: "pointer",
              }}
              value={formData.yearOfStudy}
              onChange={handleChange}
            >
              <option value="">Select year</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year} Year
                </option>
              ))}
            </select>
            {errors.yearOfStudy && (
              <p
                style={{
                  color: "var(--md-sys-color-error)",
                  fontSize: "0.875rem",
                  marginTop: "0.25rem",
                }}
              >
                {errors.yearOfStudy}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="expectedGraduationYear"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              Expected graduation year{" "}
              <span style={{ color: "var(--md-sys-color-error)" }}>*</span>
            </label>
            <input
              id="expectedGraduationYear"
              name="expectedGraduationYear"
              type="number"
              placeholder="e.g., 2025"
              required
              min={new Date().getFullYear()}
              max={new Date().getFullYear() + 10}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: errors.expectedGraduationYear
                  ? "1px solid var(--md-sys-color-error)"
                  : "1px solid var(--input-border)",
                background: "var(--input-background)",
                color: "var(--input-color)",
                fontSize: "1rem",
              }}
              value={formData.expectedGraduationYear}
              onChange={handleChange}
            />
            {errors.expectedGraduationYear && (
              <p
                style={{
                  color: "var(--md-sys-color-error)",
                  fontSize: "0.875rem",
                  marginTop: "0.25rem",
                }}
              >
                {errors.expectedGraduationYear}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="rollNumber"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              Roll number / Enrollment ID{" "}
              <span style={{ color: "var(--md-sys-color-error)" }}>*</span>
            </label>
            <input
              id="rollNumber"
              name="rollNumber"
              type="text"
              placeholder="Enter your roll number or enrollment ID"
              required
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: errors.rollNumber
                  ? "1px solid var(--md-sys-color-error)"
                  : "1px solid var(--input-border)",
                background: "var(--input-background)",
                color: "var(--input-color)",
                fontSize: "1rem",
              }}
              value={formData.rollNumber}
              onChange={handleChange}
            />
            {errors.rollNumber && (
              <p
                style={{
                  color: "var(--md-sys-color-error)",
                  fontSize: "0.875rem",
                  marginTop: "0.25rem",
                }}
              >
                {errors.rollNumber}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="collegeEmail"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              College email{" "}
              <span style={{ color: "var(--md-sys-color-error)" }}>*</span>
            </label>
            <input
              id="collegeEmail"
              name="collegeEmail"
              type="email"
              placeholder="student@university.edu"
              required
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: errors.collegeEmail
                  ? "1px solid var(--md-sys-color-error)"
                  : "1px solid var(--input-border)",
                background: "var(--input-background)",
                color: "var(--input-color)",
                fontSize: "1rem",
              }}
              value={formData.collegeEmail}
              onChange={handleChange}
            />
            {errors.collegeEmail && (
              <p
                style={{
                  color: "var(--md-sys-color-error)",
                  fontSize: "0.875rem",
                  marginTop: "0.25rem",
                }}
              >
                {errors.collegeEmail}
              </p>
            )}
            <p
              style={{
                color: "var(--md-sys-color-secondary)",
                fontSize: "0.75rem",
                marginTop: "0.25rem",
              }}
            >
              Must end with .edu, .ac.in, or similar educational domain
            </p>
          </div>

          <div>
            <label
              htmlFor="gpa"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              GPA / CGPA{" "}
              <span style={{ color: "var(--md-sys-color-error)" }}>*</span>
            </label>
            <input
              id="gpa"
              name="gpa"
              type="number"
              step="0.01"
              min="0"
              max="10"
              placeholder="e.g. 8.75 or 3.8"
              required
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: errors.gpa
                  ? "1px solid var(--md-sys-color-error)"
                  : "1px solid var(--input-border)",
                background: "var(--input-background)",
                color: "var(--input-color)",
                fontSize: "1rem",
              }}
              value={formData.gpa}
              onChange={handleChange}
            />
            {errors.gpa && (
              <p
                style={{
                  color: "var(--md-sys-color-error)",
                  fontSize: "0.875rem",
                  marginTop: "0.25rem",
                }}
              >
                {errors.gpa}
              </p>
            )}
          </div>

          <Button
            variant="filled"
            type="submit"
            disabled={isLoading}
            style={{ height: "48px", fontSize: "1rem", marginTop: "0.5rem" }}
          >
            {isLoading ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </GlassContainer>
    </main>
  );
}
