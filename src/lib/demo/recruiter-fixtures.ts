/**
 * Recruiter-demo fixtures only. Every value in this module is intentionally
 * fictional and must remain disconnected from production repositories.
 */

export type DemoOpportunity = {
  category: string;
  deadline: string;
  description: string;
  format: "Hybrid" | "In person" | "Remote";
  id: string;
  location: string;
  organization: string;
  skills: string[];
  title: string;
};

export type DemoApplicationStatus = "Planning" | "In progress" | "Submitted";

export type DemoApplication = {
  deadline: string;
  id: string;
  note: string;
  opportunityId: string;
  resumeAttached: boolean;
  status: DemoApplicationStatus;
  tasks: Array<{ completed: boolean; id: string; label: string }>;
};

export type DemoApplicantStatus =
  "New" | "In review" | "Interview" | "Finalist";

export type DemoApplicant = {
  applicationSummary: string;
  checklist: string[];
  comment: string;
  education: string;
  id: string;
  interests: string[];
  location: string;
  name: string;
  opportunityId: string;
  profileCompletion: number;
  status: DemoApplicantStatus;
};

export type DemoOnboardingState = {
  completed: boolean;
  data: {
    availability: string;
    education: string;
    interests: string[];
    location: string;
    opportunityTypes: string[];
  };
  step: number;
};

export type RecruiterDemoState = {
  applications: DemoApplication[];
  onboarding: DemoOnboardingState;
  partnerApplicants: DemoApplicant[];
  savedOpportunityIds: string[];
  version: 1;
};

export const demoStudent = {
  interests: [
    "Medicine",
    "Clinical research",
    "Public health",
    "Biotechnology",
  ],
  location: "Dallas, Texas",
  name: "Alex Morgan",
  profileCompletion: 100,
  seeking: ["Research", "Internships", "Volunteering", "Shadowing"],
  summary:
    "University student exploring patient care, translational research, and equitable public-health programs.",
} as const;

export const demoOrganization = {
  description:
    "A fictional community-health network created exclusively for this product demonstration.",
  location: "North Texas",
  name: "Northstar Health Collaborative",
  specialties: ["Community health", "Clinical education", "Research"],
} as const;

export const demoOpportunities: DemoOpportunity[] = [
  {
    category: "Clinical volunteering",
    deadline: "September 28",
    description:
      "Support patient welcome, wayfinding, and resource navigation alongside a trained volunteer coordinator.",
    format: "In person",
    id: "demo-opportunity-patient-navigation",
    location: "Dallas, Texas",
    organization: "Harborlight Community Clinic",
    skills: ["Patient communication", "Service", "Teamwork"],
    title: "Patient Navigation Volunteer",
  },
  {
    category: "Research",
    deadline: "October 12",
    description:
      "Join a fictional outcomes-research team to practice literature review, data quality checks, and poster development.",
    format: "Hybrid",
    id: "demo-opportunity-outcomes-research",
    location: "Richardson, Texas",
    organization: "Lumen Health Research Studio",
    skills: ["Research", "Data literacy", "Scientific writing"],
    title: "Clinical Outcomes Research Fellow",
  },
  {
    category: "Healthcare internship",
    deadline: "October 21",
    description:
      "Rotate through program operations, care coordination, and quality-improvement projects in a supervised setting.",
    format: "Hybrid",
    id: "demo-opportunity-care-operations",
    location: "Plano, Texas",
    organization: "Cedar Bridge Care Network",
    skills: ["Operations", "Quality improvement", "Communication"],
    title: "Care Operations Internship",
  },
  {
    category: "Public health",
    deadline: "Rolling",
    description:
      "Help design accessible prevention resources and map community services for a fictional neighborhood initiative.",
    format: "Remote",
    id: "demo-opportunity-health-equity",
    location: "Remote",
    organization: "Brightwell Public Health Lab",
    skills: ["Public health", "Community outreach", "Writing"],
    title: "Health Equity Project Assistant",
  },
  {
    category: "Biotechnology",
    deadline: "November 3",
    description:
      "Explore assay documentation, lab safety, and product-development workflows with a fictional biotech education team.",
    format: "In person",
    id: "demo-opportunity-biotech-discovery",
    location: "Irving, Texas",
    organization: "VelaNova Biosciences",
    skills: ["Laboratory practice", "Documentation", "Biotechnology"],
    title: "Biotech Discovery Intern",
  },
  {
    category: "Physician shadowing",
    deadline: "October 30",
    description:
      "Observe a structured, privacy-conscious series of simulated specialty clinics and guided physician discussions.",
    format: "In person",
    id: "demo-opportunity-shadowing",
    location: "Dallas, Texas",
    organization: "Northstar Health Collaborative",
    skills: ["Clinical observation", "Professionalism", "Reflection"],
    title: "Clinical Pathways Shadowing Series",
  },
  {
    category: "Research",
    deadline: "November 14",
    description:
      "Contribute to a fictional student research cohort studying how digital tools support preventive-care access.",
    format: "Remote",
    id: "demo-opportunity-digital-health",
    location: "Remote",
    organization: "Arcwell Digital Medicine Institute",
    skills: ["Digital health", "Research", "Presentation"],
    title: "Digital Health Research Cohort",
  },
  {
    category: "Public health",
    deadline: "Rolling",
    description:
      "Plan educational activities and evaluate participant feedback for a fictional youth wellness initiative.",
    format: "Hybrid",
    id: "demo-opportunity-wellness-program",
    location: "Garland, Texas",
    organization: "Northstar Health Collaborative",
    skills: ["Program design", "Evaluation", "Health education"],
    title: "Community Wellness Program Intern",
  },
];

const initialApplications: DemoApplication[] = [
  {
    deadline: "October 12",
    id: "demo-application-research-planning",
    note: "Connect my health-equity coursework to the cohort's outcomes-research focus.",
    opportunityId: "demo-opportunity-outcomes-research",
    resumeAttached: true,
    status: "Planning",
    tasks: [
      {
        completed: true,
        id: "demo-task-review-program",
        label: "Review program requirements",
      },
      {
        completed: false,
        id: "demo-task-draft-interest",
        label: "Draft statement of interest",
      },
      {
        completed: false,
        id: "demo-task-request-reference",
        label: "Request faculty reference",
      },
    ],
  },
  {
    deadline: "October 21",
    id: "demo-application-internship-progress",
    note: "Highlight my volunteer coordination project and interest in quality improvement.",
    opportunityId: "demo-opportunity-care-operations",
    resumeAttached: true,
    status: "In progress",
    tasks: [
      {
        completed: true,
        id: "demo-task-tailor-resume",
        label: "Tailor resume",
      },
      {
        completed: true,
        id: "demo-task-draft-response",
        label: "Draft short responses",
      },
      {
        completed: false,
        id: "demo-task-final-review",
        label: "Complete final review",
      },
    ],
  },
  {
    deadline: "September 28",
    id: "demo-application-volunteer-submitted",
    note: "Submitted after reviewing the service schedule and orientation.",
    opportunityId: "demo-opportunity-patient-navigation",
    resumeAttached: false,
    status: "Submitted",
    tasks: [
      {
        completed: true,
        id: "demo-task-availability",
        label: "Confirm weekly availability",
      },
      {
        completed: true,
        id: "demo-task-orientation",
        label: "Review orientation expectations",
      },
      {
        completed: true,
        id: "demo-task-submit",
        label: "Submit official application",
      },
    ],
  },
];

const applicantNames = [
  "Maya Rivers",
  "Eli Navarro",
  "Sofia Vale",
  "Noah Linden",
  "Priya Rowan",
  "Caleb Hart",
  "Leila Brooks",
  "Owen Mercer",
] as const;

const initialPartnerApplicants: DemoApplicant[] = applicantNames.map(
  (name, index) => ({
    applicationSummary:
      index % 2 === 0
        ? "Interested in learning how thoughtful clinical teams coordinate patient-centered care."
        : "Hopes to connect public-health coursework with a structured clinical learning experience.",
    checklist: [
      "Profile reviewed",
      index > 1 ? "Availability confirmed" : "Availability pending",
      index > 4 ? "Interview notes added" : "Interview not yet scheduled",
    ],
    comment:
      index === 1
        ? "Synthetic review note: follow up about weekday availability."
        : "",
    education: index % 3 === 0 ? "University sophomore" : "University junior",
    id: `demo-applicant-${index + 1}`,
    interests:
      index % 2 === 0
        ? ["Medicine", "Clinical research"]
        : ["Public health", "Patient advocacy"],
    location: index % 2 === 0 ? "Dallas, Texas" : "Plano, Texas",
    name,
    opportunityId:
      index < 5
        ? "demo-opportunity-shadowing"
        : "demo-opportunity-wellness-program",
    profileCompletion: 88 + index,
    status:
      index < 2
        ? "New"
        : index < 5
          ? "In review"
          : index < 7
            ? "Interview"
            : "Finalist",
  }),
);

export const recruiterDemoInitialState: RecruiterDemoState = {
  applications: initialApplications,
  onboarding: {
    completed: false,
    data: {
      availability: "Weekday afternoons and Saturday mornings",
      education: "Second-year university student",
      interests: ["Medicine", "Clinical research"],
      location: "Dallas, Texas",
      opportunityTypes: ["Research", "Clinical volunteering"],
    },
    step: 0,
  },
  partnerApplicants: initialPartnerApplicants,
  savedOpportunityIds: demoOpportunities.slice(0, 6).map(({ id }) => id),
  version: 1,
};

export function createInitialRecruiterDemoState(): RecruiterDemoState {
  return structuredClone(recruiterDemoInitialState);
}
