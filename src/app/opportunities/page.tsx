"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Opportunity } from "@/data/opportunities";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";

export default function OpportunitiesPage() {
  const [allOpportunities, setAllOpportunities] = useState<Opportunity[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"All" | "Project" | "Internship">("All");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch opportunities from backend
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/opportunities');
        if (response.ok) {
          const data = await response.json();
          // Map backend data to frontend interface
          const mappedOpportunities: Opportunity[] = data.map((item: any) => ({
            id: item.id || item._id, // Fallback for ID
            title: item.title,
            type: item.type === 'Job' ? 'Internship' : item.type,
            organization: item.organization,
            description: item.description,
            skills: item.skills || [],
            postedDate: new Date(item.posted_date).toISOString().split('T')[0],
            deadline: item.deadline || 'No deadline'
          }));
          setAllOpportunities(mappedOpportunities);
        } else {
          console.error("Failed to fetch opportunities:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching opportunities:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  // Extract all unique skills from opportunities
  const allSkills = useMemo(() => {
    const skillsSet = new Set<string>();
    allOpportunities.forEach(opp => {
      opp.skills.forEach(skill => skillsSet.add(skill));
    });
    return Array.from(skillsSet).sort();
  }, [allOpportunities]);

  // Filter opportunities based on search and filters
  const filteredOpportunities = useMemo(() => {
    return allOpportunities.filter(opp => {
      // Filter by search query
      const matchesSearch = searchQuery === "" ||
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter by type
      const matchesType = selectedType === "All" || opp.type === selectedType;

      // Filter by skills
      const matchesSkills = selectedSkills.length === 0 ||
        selectedSkills.some(skill => opp.skills.includes(skill));

      return matchesSearch && matchesType && matchesSkills;
    });
  }, [searchQuery, selectedType, selectedSkills, allOpportunities]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedType("All");
    setSelectedSkills([]);
  };

  const hasActiveFilters = searchQuery !== "" || selectedType !== "All" || selectedSkills.length > 0;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--md-sys-color-surface)' }}>
        <p>Loading Opportunities...</p>
      </div>
    );
  }

  return (
    <main
      style={{
        padding: "2rem 24px",
        maxWidth: "1200px",
        margin: "0 auto",
        minHeight: "100vh",
      }}
    >
      <header style={{ marginBottom: "3rem", textAlign: "center" }}>
        <h1
          style={{
            fontSize: "2.5rem",
            marginBottom: "1rem",
            color: "var(--md-sys-color-primary)",
          }}
        >
          Explore Opportunities
        </h1>
        <p
          style={{
            color: "var(--md-sys-color-on-surface-variant)",
            fontSize: "1.1rem",
          }}
        >
          Find the perfect project or internship to kickstart your career.
        </p>
      </header>

      {/* Search and Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          marginBottom: "2rem",
          position: "relative",
        }}
      >
        {/* Search Bar and Filter Button */}
        <div
          className="glass glow-on-hover"
          style={{
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            padding: "1rem",
            borderRadius: "16px",
          }}
        >
          {/* Search Input */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              flex: 1,
            }}
          >
            <span
              style={{
                position: "absolute",
                left: "1rem",
                color: "var(--md-sys-color-on-surface-variant)",
                fontSize: "1.25rem",
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Search opportunities by title, organization, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.875rem 1rem 0.875rem 3rem",
                fontSize: "1rem",
                borderRadius: "12px",
                border: "1px solid var(--input-border)",
                background: "var(--input-background)",
                color: "var(--input-color)",
                outline: "none",
                transition: "all 0.3s var(--motion-easing-standard)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--md-sys-color-primary)";
                e.target.style.boxShadow = "0 0 0 2px var(--liquid-hover-shadow)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--input-border)";
                e.target.style.boxShadow = "none";
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "1rem",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.25rem",
                  color: "var(--md-sys-color-on-surface-variant)",
                  padding: "0.25rem",
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Button */}
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            onMouseEnter={() => setShowFilters(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.875rem 1.5rem",
              borderRadius: "12px",
              border: hasActiveFilters
                ? "2px solid var(--md-sys-color-primary)"
                : "1px solid var(--liquid-border)",
              background: hasActiveFilters
                ? "var(--md-sys-color-primary-container)"
                : "var(--liquid-bg)",
              color: hasActiveFilters
                ? "var(--md-sys-color-on-primary-container)"
                : "var(--md-sys-color-on-surface)",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s var(--motion-easing-standard)",
              position: "relative",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: "1.25rem" }}>⚙️</span>
            Filters
            {hasActiveFilters && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "20px",
                  height: "20px",
                  padding: "0 6px",
                  borderRadius: "10px",
                  background: "var(--md-sys-color-primary)",
                  color: "var(--md-sys-color-on-primary)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                {(selectedType !== "All" ? 1 : 0) + selectedSkills.length}
              </span>
            )}
            <motion.span
              animate={{ rotate: showFilters ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              style={{ fontSize: "0.875rem" }}
            >
              ▼
            </motion.span>
          </motion.button>
        </div>

        {/* Filter Dropdown Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onMouseLeave={() => setShowFilters(false)}
              className="glass"
              style={{
                position: "absolute",
                top: "calc(100% + 0.5rem)",
                right: 0,
                zIndex: 10,
                minWidth: "400px",
                maxWidth: "500px",
                padding: "1.5rem",
                borderRadius: "16px",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
                border: "1px solid var(--md-sys-color-outline-variant)",
                background: "var(--md-sys-color-surface)",
              }}
            >
              {/* Type Filters */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h3
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    marginBottom: "0.75rem",
                    color: "var(--md-sys-color-on-surface-variant)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Type
                </h3>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  {(["All", "Project", "Internship"] as const).map((type) => (
                    <motion.button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        padding: "0.5rem 1.25rem",
                        borderRadius: "20px",
                        border: selectedType === type
                          ? "2px solid var(--md-sys-color-primary)"
                          : "1px solid var(--liquid-border)",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.3s var(--motion-easing-standard)",
                        background:
                          selectedType === type
                            ? "var(--md-sys-color-primary)"
                            : "var(--liquid-bg)",
                        color:
                          selectedType === type
                            ? "var(--md-sys-color-on-primary)"
                            : "var(--md-sys-color-on-surface)",
                      }}
                    >
                      {type}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Skill Filters */}
              <div style={{ marginBottom: "1rem" }}>
                <h3
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    marginBottom: "0.75rem",
                    color: "var(--md-sys-color-on-surface-variant)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Skills
                </h3>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                    maxHeight: "200px",
                    overflowY: "auto",
                    padding: "0.5rem",
                  }}
                >
                  {allSkills.map((skill) => (
                    <motion.button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        padding: "0.375rem 0.875rem",
                        borderRadius: "16px",
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.3s var(--motion-easing-standard)",
                        border: selectedSkills.includes(skill)
                          ? "2px solid var(--md-sys-color-primary)"
                          : "1px solid var(--liquid-border)",
                        background: selectedSkills.includes(skill)
                          ? "var(--md-sys-color-primary-container)"
                          : "var(--liquid-bg)",
                        color: selectedSkills.includes(skill)
                          ? "var(--md-sys-color-on-primary-container)"
                          : "var(--md-sys-color-on-surface)",
                      }}
                    >
                      {selectedSkills.includes(skill) && "✓ "}
                      {skill}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <div
                  style={{
                    paddingTop: "1rem",
                    borderTop: "1px solid var(--md-sys-color-outline-variant)",
                  }}
                >
                  <Button
                    variant="text"
                    onClick={clearFilters}
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      padding: "0.5rem 1rem",
                      width: "100%",
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            marginTop: "1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingLeft: "0.5rem",
          }}
        >
          <span
            style={{
              fontSize: "0.875rem",
              color: "var(--md-sys-color-on-surface-variant)",
              fontWeight: 500,
            }}
          >
            {filteredOpportunities.length} {filteredOpportunities.length === 1 ? "opportunity" : "opportunities"} found
          </span>
        </motion.div>
      </motion.div>

      {/* Opportunities Grid */}
      {filteredOpportunities.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: "center",
            padding: "4rem 2rem",
            color: "var(--md-sys-color-on-surface-variant)",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            No opportunities found
          </h2>
          <p style={{ fontSize: "1rem" }}>
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </motion.div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "2rem",
          }}
        >
          {filteredOpportunities.map((opp) => (
            <motion.div
              layoutId={opp.id}
              key={opp.id}
              onClick={() => setSelectedId(opp.id)}
              style={{ cursor: "pointer", height: "100%" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                variant="elevated"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  pointerEvents: "none",
                }}
              >
                <div style={{ marginBottom: "1rem" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      borderRadius: "16px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      backgroundColor:
                        opp.type === "Internship"
                          ? "var(--md-sys-color-tertiary-container)"
                          : "var(--md-sys-color-primary-container)",
                      color:
                        opp.type === "Internship"
                          ? "var(--md-sys-color-on-tertiary-container)"
                          : "var(--md-sys-color-on-primary-container)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {opp.type}
                  </span>
                  <motion.h2
                    style={{
                      fontSize: "1.25rem",
                      marginBottom: "0.5rem",
                      lineHeight: 1.4,
                    }}
                  >
                    {opp.title}
                  </motion.h2>
                  <motion.p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--md-sys-color-secondary)",
                      fontWeight: 500,
                    }}
                  >
                    {opp.organization}
                  </motion.p>
                </div>

                <motion.p
                  style={{
                    fontSize: "0.95rem",
                    lineHeight: 1.5,
                    marginBottom: "1.5rem",
                    flex: 1,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {opp.description}
                </motion.p>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  {opp.skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      style={{
                        fontSize: "0.75rem",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        border:
                          "1px solid var(--md-sys-color-outline, #79747E)",
                        color: "var(--md-sys-color-on-surface-variant)",
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                  {opp.skills.length > 3 && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "2px 8px",
                        color: "var(--md-sys-color-secondary)",
                      }}
                    >
                      +{opp.skills.length - 3} more
                    </span>
                  )}
                </div>

                <div
                  style={{
                    marginTop: "auto",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--md-sys-color-secondary)",
                    }}
                  >
                    Deadline: {opp.deadline}
                  </span>
                  <Button
                    variant="glass"
                    style={{
                      pointerEvents: "auto",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    Read More
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(4px)",
                zIndex: 40,
              }}
            />
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 50,
                pointerEvents: "none",
              }}
            >
              {allOpportunities
                .filter((item) => item.id === selectedId)
                .map((opp) => (
                  <motion.div
                    layoutId={selectedId}
                    key={opp.id}
                    style={{
                      width: "90%",
                      maxWidth: "700px",
                      maxHeight: "85vh",
                      overflowY: "auto",
                      background: "var(--md-sys-color-surface)",
                      borderRadius: "24px",
                      padding: "2rem",
                      pointerEvents: "auto",
                      position: "relative",
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    }}
                  >
                    <Button
                      variant="glass"
                      onClick={() => setSelectedId(null)}
                      style={{
                        position: "absolute",
                        top: "1rem",
                        right: "1rem",
                        minWidth: "auto",
                        padding: "8px",
                        borderRadius: "50%",
                        width: "36px",
                        height: "36px",
                      }}
                    >
                      ✕
                    </Button>

                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        borderRadius: "16px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        backgroundColor:
                          opp.type === "Internship"
                            ? "var(--md-sys-color-tertiary-container)"
                            : "var(--md-sys-color-primary-container)",
                        color:
                          opp.type === "Internship"
                            ? "var(--md-sys-color-on-tertiary-container)"
                            : "var(--md-sys-color-on-primary-container)",
                        marginBottom: "1rem",
                      }}
                    >
                      {opp.type}
                    </span>

                    <motion.h2
                      style={{
                        fontSize: "2rem",
                        marginBottom: "0.5rem",
                        color: "var(--md-sys-color-on-surface)",
                      }}
                    >
                      {opp.title}
                    </motion.h2>
                    <motion.p
                      style={{
                        fontSize: "1.1rem",
                        color: "var(--md-sys-color-secondary)",
                        marginBottom: "2rem",
                        fontWeight: 500,
                      }}
                    >
                      {opp.organization}
                    </motion.p>

                    <motion.div style={{ marginBottom: "2rem" }}>
                      <h3
                        style={{
                          fontSize: "1.2rem",
                          marginBottom: "0.5rem",
                          fontWeight: 600,
                        }}
                      >
                        Description
                      </h3>
                      <p
                        style={{
                          lineHeight: 1.7,
                          color: "var(--md-sys-color-on-surface-variant)",
                        }}
                      >
                        {opp.description}
                      </p>
                    </motion.div>

                    <div style={{ marginBottom: "2rem" }}>
                      <h3
                        style={{
                          fontSize: "1.2rem",
                          marginBottom: "0.5rem",
                          fontWeight: 600,
                        }}
                      >
                        Required Skills
                      </h3>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.5rem",
                        }}
                      >
                        {opp.skills.map((skill) => (
                          <span
                            key={skill}
                            style={{
                              fontSize: "0.9rem",
                              padding: "4px 12px",
                              borderRadius: "6px",
                              border:
                                "1px solid var(--md-sys-color-outline, #79747E)",
                              color: "var(--md-sys-color-on-surface-variant)",
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingTop: "1rem",
                        borderTop:
                          "1px solid var(--md-sys-color-outline-variant)",
                      }}
                    >
                      <span
                        style={{ color: "var(--md-sys-color-secondary)" }}
                      >
                        Deadline: <strong>{opp.deadline}</strong>
                      </span>
                      <Link href={`/opportunities/${opp.id}`}>
                        <Button
                          variant="filled"
                          style={{ padding: "12px 24px", fontSize: "1rem" }}
                        >
                          Apply Now
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
            </div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
