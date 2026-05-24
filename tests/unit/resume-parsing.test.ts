import { describe, expect, it } from "vitest";

import { parseResumeTextDeterministically } from "@/lib/ai/resume-parsing";

const roleFirstResumeText = `
Mohit Bapatla
bapatlamohit@gmail.com
469-900-7827

Education
University of Texas at Austin
BS Computer Science
Expected May 2028

Founder/CEO April 2024 - Present
Future Physicians Remote
Built and scaled a healthcare opportunity platform for students.
Led partner outreach, product strategy, and operations.

Engagement Executive Jan 2023 - Apr 2024
Nightingale Advocacy Dallas, TX
Coordinated student outreach and healthcare advocacy initiatives.

Projects
Heart Disease Risk Prediction System
Built a machine learning model with SHAP explanations.
ResumeIQ
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

    expect(parsed.summary).toContain("Name: Mohit Bapatla");
    expect(parsed.summary).toContain("Email: bapatlamohit@gmail.com");
    expect(parsed.summary).toContain("Phone: 469-900-7827");
    expect(education).toContain("University of Texas at Austin");
    expect(education).toContain("BS Computer Science");
    expect(education).toContain("Expected May 2028");
    expect(experience).toContain("Founder/CEO at Future Physicians");
    expect(experience).toContain(
      "Engagement Executive at Nightingale Advocacy",
    );
    expect(parsed.projects).toEqual([
      "Heart Disease Risk Prediction System",
      "ResumeIQ",
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
