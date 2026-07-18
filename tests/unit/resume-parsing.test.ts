import { describe, expect, it } from "vitest";

import { parseResumeTextDeterministically } from "@/lib/ai/resume-parsing";

const roleFirstResumeText = `
Synthetic Applicant
synthetic.applicant@example.invalid
202-555-0100

Education
Example University
BS Biology
Expected May 2028

Program Lead April 2024 - Present
Example Health Initiative Remote
Built and scaled a synthetic healthcare opportunity program for students.
Led partner outreach and program operations.

Volunteer Coordinator Jan 2023 - Apr 2024
Example Community Clinic Dallas, TX
Coordinated student outreach and healthcare advocacy initiatives.

Projects
Synthetic Health Risk Model
Built a machine learning model with SHAP explanations.
Example Resume Analyzer
Developed a resume analysis tool with FastAPI and Streamlit.

Technical Skills
Languages: Python, SQL
Libraries: pandas, NumPy, scikit-learn, SHAP
Frameworks: FastAPI, Streamlit
Tools: Git/GitHub
Concepts: Machine Learning, Model Evaluation, Data Analysis
`;

describe("resume parsing", () => {
  it("infers role-first experience and projects when no Experience heading exists", () => {
    const parsed = parseResumeTextDeterministically(roleFirstResumeText);
    const education = parsed.education.join(" ");
    const experience = parsed.experience.join(" ");

    expect(parsed.summary).toBeNull();
    expect(education).toContain("Example University");
    expect(education).toContain("BS Biology");
    expect(education).toContain("Expected May 2028");
    expect(experience).toContain("Program Lead at Example Health Initiative");
    expect(experience).toContain(
      "Volunteer Coordinator at Example Community Clinic",
    );
    expect(parsed.projects).toEqual([
      "Synthetic Health Risk Model",
      "Example Resume Analyzer",
    ]);
    expect(parsed.skills).toEqual(
      expect.arrayContaining([
        "Python",
        "SQL",
        "pandas",
        "NumPy",
        "scikit-learn",
        "SHAP",
        "FastAPI",
        "Streamlit",
        "Git/GitHub",
        "Machine Learning",
        "Model Evaluation",
        "Data Analysis",
      ]),
    );
  });
});
