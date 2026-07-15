export const siteConfig = {
  name: "Future Physicians",
  shortName: "FP",
  url: "https://futurephysicians.org",
  description:
    "Future Physicians helps students discover, apply to, and manage verified healthcare opportunities from one profile.",
  emails: {
    support: "support@futurephysicians.org",
    partnerships: "outreach@futurephysicians.org",
    fundraising: "fundraising@futurephysicians.org",
  },
  links: {
    chapterApplication:
      "https://docs.google.com/forms/d/e/1FAIpQLSeT-FOoYXGwLMgDIqr-kTCPGceFSnkgn_FAyp3C_9M9eo6y3g/viewform",
    donation: "https://hcb.hackclub.com/donations/start/future-physicians",
    instagram: "https://www.instagram.com/futurephysiciansmedia/",
    linkedin: "https://www.linkedin.com/company/104746121/",
    newsletter: "https://futurephysicians.substack.com/",
    seminarRecording: "https://www.youtube.com/watch?v=6U2EA3O12YY",
    tiktok: "https://www.tiktok.com/@futurephysicians.org",
  },
} as const;

export const organizationImpactReporting = {
  asOf: null,
  disclosure:
    "Organization-wide totals are withheld because no dated, approved source is currently available for publication.",
  status: "withheld-pending-source-approval",
} as const;

export const impactMetricDefinitions = [
  {
    term: "Community participants",
    meaning:
      "Distinct students documented as participating in defined FP programs, events, or community channels during a stated period.",
    boundary:
      "Not the same as registered dashboard users, applicants, acceptances, or placements.",
  },
  {
    term: "Registered users",
    meaning: "People with an FP account during a stated period.",
    boundary:
      "An account record does not establish program participation, application, or placement.",
  },
  {
    term: "Applicants",
    meaning: "Students with an application record for an opportunity.",
    boundary: "Application does not mean interview, acceptance, or placement.",
  },
  {
    term: "Students connected",
    meaning:
      "A broad relationship term that requires a specific program definition before reporting.",
    boundary: "FP does not use it here as a substitute for placements.",
  },
  {
    term: "Placements",
    meaning: "Confirmed student participation in a program position.",
    boundary:
      "A public total requires an approved source, reporting period, and confirmation method.",
  },
  {
    term: "Event registrants",
    meaning: "People who completed registration for a named event.",
    boundary: "Not the same as live attendees or peak concurrent viewers.",
  },
  {
    term: "Event attendees",
    meaning: "People reported as attending a named live event.",
    boundary:
      "Tracked separately from registrations, peak viewers, and watch minutes.",
  },
  {
    term: "Paid interns",
    meaning: "Students confirmed in paid internship positions.",
    boundary:
      "A public count requires a documented position and confirmation method.",
  },
  {
    term: "Partner organizations",
    meaning:
      "Distinct organizations with an approved program or opportunity relationship during a stated period.",
    boundary:
      "Grant funders, event promoters, and institutional recognition are separate categories.",
  },
  {
    term: "Grant or sponsorship revenue",
    meaning: "Funds received in those specific relationship categories.",
    boundary:
      "This is separate from student stipend value offered or paid through a partner program.",
  },
  {
    term: "Student stipends facilitated",
    meaning:
      "Documented student stipend value facilitated through identified partner programs during a stated period.",
    boundary:
      "Not a count of placements and not grant revenue, donations, or money received by FP.",
  },
  {
    term: "Modeled program value",
    meaning:
      "An estimate based on stated assumptions rather than a direct transaction total.",
    boundary:
      "Modeled value must be labeled as an estimate and kept separate from verified payments.",
  },
] as const;

export const grants = [
  {
    amount: "$15,000",
    funder: "Community Hospital of Long Beach Foundation",
  },
  { amount: "$1,000", funder: "Karma for Cara Grant" },
  { amount: "$720", funder: "North Carolina Community Foundation" },
] as const;

export const seminar = {
  slug: "global-healthcare-seminar-2025",
  title: "Future Physicians Global Healthcare Seminar",
  date: "September 27, 2025",
  isoDate: "2025-09-27",
  status: "Event completed",
  description:
    "The seminar brought together students and healthcare speakers for discussions about pathways into medicine.",
  metricsAsOf: {
    date: "September 27, 2025",
    isoDate: "2025-09-27",
  },
  metrics: [
    {
      value: "825",
      label: "Registrations",
      definition: "People who completed registration for this seminar.",
    },
    {
      value: "500",
      label: "Live attendees",
      definition: "People reported as attending the live seminar.",
    },
    {
      value: "225",
      label: "Peak viewers",
      definition:
        "The highest reported number of concurrent viewers during the live seminar.",
    },
    {
      value: "30,000+",
      label: "Watch minutes",
      definition: "Total watch minutes reported for this seminar.",
    },
    {
      value: "50+",
      label: "Countries represented",
      definition: "Countries represented among reported seminar participants.",
    },
    {
      value: "300+",
      label: "Audience questions",
      definition: "Questions reported as submitted by the seminar audience.",
    },
  ],
  recognition: ["UC Riverside", "The George Washington University"],
} as const;

export const faqGroups = [
  {
    id: "student-accounts",
    title: "Student accounts",
    items: [
      {
        question: "Who can join Future Physicians?",
        answer:
          "Future Physicians is designed for high school, college, graduate, and medical students exploring healthcare careers. Available opportunities still have their own age, location, education, and experience requirements.",
      },
      {
        question: "Is Future Physicians free for students?",
        answer:
          "Creating a student profile and using the FP Dashboard is free. Individual programs may disclose separate costs, travel needs, or unpaid participation on their listings.",
      },
      {
        question: "What information goes in my profile?",
        answer:
          "Your profile can include education level, location, interests, experience, availability, preferences, and reusable application materials. You control the information you submit.",
      },
      {
        question: "How do I create a student profile?",
        answer:
          "Create a free account, then complete the student onboarding steps in the FP Dashboard. You can add or update your education level, interests, experience, location, availability, preferences, and reusable application materials there.",
      },
    ],
  },
  {
    id: "opportunities",
    title: "Opportunities",
    items: [
      {
        question: "How are opportunities verified?",
        answer:
          "FP reviews the source, deadline, eligibility, application path, and publication status before an opportunity appears in the student directory. Details can change, so students should also review the linked official source.",
      },
      {
        question: "Does a recommendation mean I am eligible?",
        answer:
          "No. Recommendations use the information available in your profile and the listing, but they do not guarantee eligibility. Always review every published requirement before applying.",
      },
      {
        question: "What happens when an opportunity closes?",
        answer:
          "Closed or expired opportunities stop accepting new applications. Existing application records remain available in the dashboard, and saved listings may offer reopening alerts when supported.",
      },
    ],
  },
  {
    id: "applications",
    title: "Applications",
    items: [
      {
        question: "What is an FP-managed application?",
        answer:
          "An FP-managed application is prepared or submitted through the FP Dashboard. Other listings send you to an official partner portal or use an introduction or interest process.",
      },
      {
        question: "Can I track an external application?",
        answer:
          "Yes. The dashboard can keep deadlines, notes, status, and next steps together even when the final submission happens on an external website.",
      },
      {
        question: "How do external applications work?",
        answer:
          "FP directs you to the organization’s official application path when a listing uses an external portal. The organization receives and reviews that submission under its own process; you can use the FP Dashboard to record progress and next steps.",
      },
      {
        question: "Does FP guarantee placement?",
        answer:
          "No. An application does not guarantee acceptance, an introduction does not guarantee a response, and Future Physicians does not guarantee interviews or placement.",
      },
      {
        question: "What does waitlisted mean?",
        answer:
          "Waitlisted means your application is still active, but a place is not currently confirmed. The organization or FP team will update the record when the status changes.",
      },
    ],
  },
  {
    id: "partners",
    title: "Partners",
    items: [
      {
        question: "Who can list an opportunity?",
        answer:
          "Hospitals, clinics, laboratories, universities, schools, nonprofits, community organizations, and healthcare programs can contact FP. Organizations and listings are reviewed before student publication.",
      },
      {
        question: "How does FP verify organizations?",
        answer:
          "FP reviews organization and source information before publishing a listing. Verification records that review; it is not an endorsement, a guarantee of program quality, or a promise of a student outcome.",
      },
      {
        question: "What student data can partners see?",
        answer:
          "Partners can access only the applicant or student information authorized for their opportunity and workflow. They do not receive unrestricted access to the student directory.",
      },
    ],
  },
  {
    id: "chapters-events",
    title: "Chapters and events",
    items: [
      {
        question: "Can my school start a chapter?",
        answer:
          "Students can apply to start or join a chapter. Approval is not automatic, and chapters are responsible for active leadership, accurate communication, and coordination with the national organization.",
      },
      {
        question: "Does every chapter receive funding?",
        answer:
          "No. Chapter approval does not guarantee funding, exclusive opportunities, hospital access, or participation in every national program.",
      },
      {
        question: "Where are event recordings available?",
        answer:
          "Completed events with approved recordings are listed on the Events page. Upcoming events show registration details only while registration is active.",
      },
      {
        question: "Where can I find upcoming events?",
        answer:
          "Confirmed upcoming programs and registration details appear on the Events page after they are published. If no upcoming event is listed, you can subscribe to the Future Physicians newsletter for new program announcements.",
      },
    ],
  },
  {
    id: "privacy-support",
    title: "Privacy and support",
    items: [
      {
        question: "Who can see my profile?",
        answer:
          "Your profile is not a public page. Access is limited by role and application context, and partners may see only information authorized for the opportunities they manage.",
      },
      {
        question: "How do I report incorrect information?",
        answer:
          "Signed-in students can report a broken link, incorrect deadline, eligibility issue, or closed program from the opportunity workspace. You can also email support@futurephysicians.org.",
      },
      {
        question: "How do I contact support?",
        answer:
          "Email support@futurephysicians.org for account, application, opportunity, or general questions, or use the Contact page to find the partnerships and fundraising addresses. Do not include sensitive profile or document details in an initial email.",
      },
    ],
  },
] as const;

export const allFaqItems: ReadonlyArray<{
  question: string;
  answer: string;
}> = faqGroups.flatMap((group) => [...group.items]);
