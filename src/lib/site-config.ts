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

export const publicMetrics = [
  {
    value: "2,000+",
    label: "students in the FP community",
    definition:
      "Students who have joined Future Physicians programs, events, or community channels; this is not the same as a placement count.",
  },
  {
    value: "50+",
    label: "partner organizations",
    definition:
      "Organizations recorded by Future Physicians as program or opportunity partners; event promoters and grant funders are categorized separately.",
  },
  {
    value: "50+",
    label: "countries reached",
    definition:
      "Countries represented across Future Physicians community and event participation.",
  },
  {
    value: "$300K+",
    label: "student stipends facilitated",
    definition:
      "Student stipend value facilitated through partner programs. This is not grant revenue, donations, or funding received by Future Physicians.",
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
    "A global healthcare event featuring doctors, admissions officers, and Harvard students sharing their journeys in medicine.",
  metrics: [
    { value: "825", label: "Registrations" },
    { value: "500", label: "Live attendees" },
    { value: "225", label: "Peak viewers" },
    { value: "30,000+", label: "Watch minutes" },
    { value: "50+", label: "Countries represented" },
    { value: "300+", label: "Audience questions" },
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
