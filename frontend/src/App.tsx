import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const API_URL = "https://curriculum-gap-analyser-backend.onrender.com";

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "16px",
  padding: "28px",
  marginBottom: "28px",
  boxShadow: "0 4px 20px rgba(76, 29, 149, 0.08)",
  border: "1px solid #f0eefc",
};

const inputStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: "8px",
  border: "1.5px solid #e0dcf5",
  fontSize: "14px",
  outline: "none",
};

const buttonStyle: React.CSSProperties = {
  padding: "12px 24px",
  borderRadius: "8px",
  border: "none",
  background: "linear-gradient(135deg, #4361ee, #7209b7)",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "14px",
  boxShadow: "0 4px 12px rgba(67, 97, 238, 0.35)",
};

const buttonDisabledStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#c7c2e0",
  boxShadow: "none",
  cursor: "not-allowed",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #4361ee, #7209b7)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "14px",
  marginRight: "10px",
  flexShrink: 0,
};

const statCardStyle: React.CSSProperties = {
  flex: 1,
  minWidth: "140px",
  padding: "18px",
  borderRadius: "12px",
  textAlign: "center",
};

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [skillsFound, setSkillsFound] = useState<string[]>([]);
  const [curriculumId, setCurriculumId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [jobFile, setJobFile] = useState<File | null>(null);
  const [jobFileExtractedText, setJobFileExtractedText] = useState<string>("");
  const [jobFileSkillsFound, setJobFileSkillsFound] = useState<string[]>([]);
  const [jobFileLoading, setJobFileLoading] = useState(false);
  const [jobFileError, setJobFileError] = useState<string>("");

  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [preferredSkills, setPreferredSkills] = useState("");
  const [description, setDescription] = useState("");
  const [jobSubmitting, setJobSubmitting] = useState(false);
  const [jobError, setJobError] = useState("");
  const [jobSuccess, setJobSuccess] = useState("");
  const [requirementId, setRequirementId] = useState<number | null>(null);

  const [matchedSkills, setMatchedSkills] = useState<string[]>([]);
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [coveragePercentage, setCoveragePercentage] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [gapLoading, setGapLoading] = useState(false);
  const [gapError, setGapError] = useState("");
  const [similarityPercentage, setSimilarityPercentage] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please choose a file first.");
      return;
    }
    setLoading(true);
    setError("");
    setExtractedText("");
    setSkillsFound([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Upload failed");
      }
      const data = await response.json();
      setExtractedText(data.extracted_text);
      setSkillsFound(data.skills_found || []);
      setCurriculumId(data.curriculum_id || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleJobFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setJobFile(e.target.files[0]);
      setJobFileError("");
    }
  };

  const handleJobFileUpload = async () => {
    if (!jobFile) {
      setJobFileError("Please choose a file first.");
      return;
    }
    setJobFileLoading(true);
    setJobFileError("");
    setJobFileExtractedText("");
    setJobFileSkillsFound([]);

    const formData = new FormData();
    formData.append("file", jobFile);

    try {
      const response = await fetch(`${API_URL}/upload-industry-requirement`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Upload failed");
      }
      const data = await response.json();
      setJobFileExtractedText(data.extracted_text);
      setJobFileSkillsFound(data.skills_found || []);
    } catch (err) {
      setJobFileError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setJobFileLoading(false);
    }
  };

  const handleGapAnalysis = async () => {
    const industrySkills = requiredSkills.trim()
      ? requiredSkills.split(",").map((s) => s.trim()).filter(Boolean)
      : jobFileSkillsFound;

    if (skillsFound.length === 0 || industrySkills.length === 0) {
      setGapError("Please upload/enter both curriculum skills and required skills first.");
      return;
    }
    setGapLoading(true);
    setGapError("");

    try {
      const response = await fetch(`${API_URL}/gap-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          curriculum_id: curriculumId,
          requirement_id: requirementId,
          curriculum_skills: skillsFound,
          required_skills: industrySkills,
        }),
      });
      if (!response.ok) throw new Error("Gap analysis failed");
      
      const data = await response.json();
setMatchedSkills(data.matched_skills);
setMissingSkills(data.missing_skills);
setRecommendations(data.recommendations);

const tfidfResponse = await fetch(`${API_URL}/gap-analysis-tfidf`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    curriculum_text: extractedText,
    job_text: jobFileExtractedText || description,
  }),
});
if (tfidfResponse.ok) {
  const tfidfData = await tfidfResponse.json();
  setSimilarityPercentage(tfidfData.similarity_percentage);
}

      setCoveragePercentage(data.coverage_percentage);
    
    } catch (err) {
      setGapError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGapLoading(false);
    }
  };

  const handleJobSubmit = async () => {
    if (!jobTitle.trim() || !requiredSkills.trim()) {
      setJobError("Job title and required skills are required.");
      return;
    }
    setJobSubmitting(true);
    setJobError("");
    setJobSuccess("");

    const payload = {
      jobTitle: jobTitle.trim(),
      company: company.trim(),
      requiredSkills: requiredSkills.split(",").map((s) => s.trim()).filter(Boolean),
      preferredSkills: preferredSkills.split(",").map((s) => s.trim()).filter(Boolean),
      description: description.trim(),
      source: "Manual entry",
    };

    try {
      const response = await fetch(`${API_URL}/industry-requirement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Submission failed");
      }
      const data = await response.json();
      setRequirementId(data.requirement_id || null);
      setJobSuccess(`Saved "${jobTitle}" successfully.`);
      setJobTitle("");
      setCompany("");
      setPreferredSkills("");
      setDescription("");
    } catch (err) {
      setJobError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setJobSubmitting(false);
    }
  };

  return (
    <div style={{ background: "#f6f4fd", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #4361ee 0%, #7209b7 100%)",
          padding: "56px 20px",
          textAlign: "center",
          color: "#fff",
          boxShadow: "0 6px 24px rgba(67, 97, 238, 0.25)",
        }}
      >
        <h1 style={{ fontSize: "36px", margin: "0 0 8px 0", letterSpacing: "-0.5px" }}>
          🎓 Curriculum Gap Analyser
        </h1>
        <p style={{ fontSize: "15px", opacity: 0.9, margin: 0 }}>
          AI-powered comparison of university curriculum against industry skill requirements
        </p>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "36px 20px" }}>
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: "#1a1f36", display: "flex", alignItems: "center" }}>
            <span style={badgeStyle}>1</span> Upload Curriculum
          </h2>
          <p style={{ color: "#666" }}>📄 Upload a curriculum document (PDF, DOCX, or TXT) to extract its text.</p>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileChange} />
            <button onClick={handleUpload} disabled={loading} style={loading ? buttonDisabledStyle : buttonStyle}>
              {loading ? "Uploading..." : "Upload"}
            </button>
          </div>

          {error && <p style={{ color: "#e03131" }}>{error}</p>}

          {skillsFound.length > 0 && (
            <div style={{ marginTop: "20px", padding: "18px", background: "linear-gradient(135deg, #eef1ff, #f6eefe)", borderRadius: "10px", border: "1px solid #e0dcf5" }}>
              <h3 style={{ marginTop: 0, color: "#4361ee" }}>✅ Skills Detected ({skillsFound.length})</h3>
              <p style={{ margin: 0, color: "#333" }}>{skillsFound.join(", ")}</p>
            </div>
          )}

          {extractedText && (
            <div style={{ marginTop: "20px" }}>
              <h3 style={{ color: "#1a1f36" }}>Extracted Text ({extractedText.length} characters)</h3>
              <textarea
                readOnly
                value={extractedText}
                style={{ width: "100%", height: "180px", borderRadius: "8px", border: "1.5px solid #e0dcf5", padding: "12px" }}
              />
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: "#1a1f36", display: "flex", alignItems: "center" }}>
            <span style={badgeStyle}>2</span> Add Industry Requirement
          </h2>
          <p style={{ color: "#666" }}>💼 Enter a job role and the skills it requires.</p>

          <div style={{ marginBottom: "20px", padding: "18px", background: "#fafafe", border: "1.5px solid #e0dcf5", borderRadius: "10px" }}>
            <p style={{ marginTop: 0 }}><strong>Option A: Upload a job description file</strong></p>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <input type="file" accept=".pdf,.docx,.txt" onChange={handleJobFileChange} />
              <button onClick={handleJobFileUpload} disabled={jobFileLoading} style={jobFileLoading ? buttonDisabledStyle : buttonStyle}>
                {jobFileLoading ? "Extracting..." : "Extract Text"}
              </button>
            </div>
            {jobFileError && <p style={{ color: "#e03131" }}>{jobFileError}</p>}

            {jobFileSkillsFound.length > 0 && (
              <div style={{ marginTop: "12px", padding: "14px", background: "linear-gradient(135deg, #eef1ff, #f6eefe)", borderRadius: "10px" }}>
                <h4 style={{ marginTop: 0, color: "#4361ee" }}>Skills Detected ({jobFileSkillsFound.length})</h4>
                <p style={{ margin: 0 }}>{jobFileSkillsFound.join(", ")}</p>
              </div>
            )}

            {jobFileExtractedText && (
              <div style={{ marginTop: "12px" }}>
                <p style={{ fontSize: "13px", color: "#666" }}>
                  Extracted text ({jobFileExtractedText.length} characters) — copy relevant skills into the fields below:
                </p>
                <textarea
                  readOnly
                  value={jobFileExtractedText}
                  style={{ width: "100%", height: "140px", borderRadius: "8px", border: "1.5px solid #e0dcf5", padding: "12px" }}
                />
              </div>
            )}
          </div>

          <p><strong>Option B: Enter manually</strong></p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input style={inputStyle} type="text" placeholder="Job Title (required)" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
            <input style={inputStyle} type="text" placeholder="Company (optional)" value={company} onChange={(e) => setCompany(e.target.value)} />
            <input style={inputStyle} type="text" placeholder="Required Skills, comma-separated (e.g. Python, SQL, Git)" value={requiredSkills} onChange={(e) => setRequiredSkills(e.target.value)} />
            <input style={inputStyle} type="text" placeholder="Preferred Skills, comma-separated (optional)" value={preferredSkills} onChange={(e) => setPreferredSkills(e.target.value)} />
            <textarea style={{ ...inputStyle, height: "80px" }} placeholder="Job description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
            <button onClick={handleJobSubmit} disabled={jobSubmitting} style={jobSubmitting ? buttonDisabledStyle : buttonStyle}>
              {jobSubmitting ? "Saving..." : "Save Industry Requirement"}
            </button>
          </div>

          {jobError && <p style={{ color: "#e03131" }}>{jobError}</p>}
          {jobSuccess && <p style={{ color: "#2f9e44" }}>{jobSuccess}</p>}
        </div>

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: "#1a1f36", display: "flex", alignItems: "center" }}>
            <span style={badgeStyle}>3</span> Gap Analysis
          </h2>
          <p style={{ color: "#666" }}>📊 Compare the curriculum's detected skills against the job's required skills.</p>

          <button onClick={handleGapAnalysis} disabled={gapLoading} style={gapLoading ? buttonDisabledStyle : buttonStyle}>
            {gapLoading ? "Analyzing..." : "Run Gap Analysis"}
          </button>

          {gapError && <p style={{ color: "#e03131" }}>{gapError}</p>}

          {coveragePercentage !== null && (
            <div style={{ marginTop: "28px" }}>
              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "24px" }}>
                <div style={{ ...statCardStyle, background: "linear-gradient(135deg, #4361ee, #7209b7)", color: "#fff" }}>
                  <div style={{ fontSize: "28px", fontWeight: 700 }}>{coveragePercentage}%</div>
                  <div style={{ fontSize: "13px", opacity: 0.9 }}>Coverage</div>
                </div>
                <div style={{ ...statCardStyle, background: "#ebfbee" }}>
                  <div style={{ fontSize: "28px", fontWeight: 700, color: "#2b8a3e" }}>{matchedSkills.length}</div>
                  <div style={{ fontSize: "13px", color: "#2b8a3e" }}>Matched Skills</div>
                </div>
                <div style={{ ...statCardStyle, background: "#fff5f5" }}>
                  <div style={{ fontSize: "28px", fontWeight: 700, color: "#c92a2a" }}>{missingSkills.length}</div>
                  <div style={{ fontSize: "13px", color: "#c92a2a" }}>Missing Skills</div>
                </div>
                <div style={{ ...statCardStyle, background: "#e8eaf6" }}>
  <div style={{ fontSize: "28px", fontWeight: 700, color: "#4361ee" }}>
    {similarityPercentage !== null ? `${similarityPercentage}%` : "—"}
  </div>
  <div style={{ fontSize: "13px", color: "#4361ee" }}>Text Similarity (TF-IDF)</div>
</div>
              </div>

              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Matched", value: matchedSkills.length },
                      { name: "Missing", value: missingSkills.length },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    <Cell fill="#40c057" />
                    <Cell fill="#fa5252" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>

              <div style={{ padding: "16px", background: "#ebfbee", borderRadius: "10px", marginBottom: "12px", marginTop: "20px" }}>
                <strong style={{ color: "#2b8a3e" }}>✅ Matched Skills:</strong> {matchedSkills.join(", ") || "None"}
              </div>

              <div style={{ padding: "16px", background: "#fff5f5", borderRadius: "10px", marginBottom: "12px" }}>
                <strong style={{ color: "#c92a2a" }}>⚠️ Missing Skills:</strong> {missingSkills.join(", ") || "None"}
              </div>

              {recommendations.length > 0 && (
                <div style={{ padding: "16px", background: "linear-gradient(135deg, #eef1ff, #f6eefe)", borderRadius: "10px" }}>
                  <strong style={{ color: "#4361ee" }}>💡 Recommendations:</strong>
                  <ul style={{ marginBottom: 0 }}>
                    {recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;