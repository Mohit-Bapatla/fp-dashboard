export const siteConfig = {
  name: "Future Physicians",
  shortName: "FP",
  url: "https://www.futurephysicians.org",
  description:
    "Future Physicians helps students discover, apply to, and manage verified healthcare opportunities from one profile.",
  emails: {
    support: "support@futurephysicians.org",
    partnerships: "outreach@futurephysicians.org",
    fundraising: "fundraising@futurephysicians.org",
  },
  mailto: {
    support: "mailto:support@futurephysicians.org",
    partnerships:
      "mailto:outreach@futurephysicians.org?subject=Future%20Physicians%20Partnership%20Inquiry",
    fundraising:
      "mailto:fundraising@futurephysicians.org?subject=Funding%20Future%20Physicians",
  },
  contact: {
    generalSupport: {
      id: "general-support",
      href: "/contact#general-support",
    },
    partnerships: {
      id: "partnerships",
      href: "/contact#partnerships",
    },
    fundraising: {
      id: "fundraising",
      href: "/contact#fundraising",
    },
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
  fiscalSponsor: {
    legalName: "The Hack Foundation",
    publicName: "Hack Club",
    relationship:
      "Future Physicians is fiscally sponsored by The Hack Foundation (d.b.a. Hack Club), a 501(c)(3) nonprofit.",
    donationNotice:
      "Donations are processed through HCB. Donors receive the official receipt from HCB and should retain it. Tax treatment depends on applicable law and the receipt, and HCB fees and terms can change.",
  },
} as const;

export const organizationMetrics = [
  {
    value: "2,000+",
    label: "Students in the FP community",
  },
  {
    value: "50+",
    label: "Partner organizations",
  },
  {
    value: "$300K+",
    label: "Student stipends facilitated through partner programs",
  },
] as const;

export const organizationMetricsAsOf = {
  date: "July 20, 2026",
  isoDate: "2026-07-20",
} as const;

export const impactMethodologyNote =
  "These figures represent cumulative Future Physicians activity as of July 20, 2026. The stipend figure reflects funding facilitated through partner programs, not money paid directly by Future Physicians.";

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
        id: "student-profile-eligibility",
        question: "Who can create a student profile?",
        answer:
          "People age 13 or older who are interested in exploring a healthcare career or gaining healthcare experience can create a student profile.",
      },
      {
        id: "student-dashboard-free",
        question: "Is Future Physicians free for students?",
        answer:
          "Yes. Creating a student profile and using the FP Dashboard is free.",
      },
      {
        id: "student-profile-information",
        question: "What information goes in my profile?",
        answer:
          "Your profile can include education level, location, interests, experience, availability, preferences, and reusable application materials. You control the information you submit.",
      },
      {
        id: "student-profile-creation",
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
        id: "opportunity-verification",
        question: "How are opportunities verified?",
        answer:
          "FP reviews the source, deadline, eligibility, application path, and publication status before an opportunity appears in the student directory. Details can change, so students should also review the linked official source.",
      },
      {
        id: "recommendation-eligibility",
        question: "Does a recommendation mean I am eligible?",
        answer:
          "No. Recommendations use the information available in your profile and the listing, but they do not guarantee eligibility. Always review every published requirement before applying.",
      },
      {
        id: "closed-opportunity",
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
        id: "fp-managed-application",
        question: "What is an FP-managed application?",
        answer:
          "An FP-managed application is prepared or submitted through the FP Dashboard. Other listings send you to an official partner portal or use an introduction or interest process.",
      },
      {
        id: "external-application-tracking",
        question: "Can I track an external application?",
        answer:
          "Yes. The dashboard can keep deadlines, notes, status, and next steps together even when the final submission happens on an external website.",
      },
      {
        id: "application-process",
        question: "How do applications work?",
        answer:
          "Some applications are managed through the FP Dashboard, while others redirect to an organization’s official application path. In either case, you can use the dashboard to keep deadlines, progress, and next steps organized.",
      },
      {
        id: "placement-guarantee",
        question: "Does Future Physicians guarantee a placement?",
        answer:
          "No. Future Physicians helps students find relevant opportunities and stay organized throughout the application process, but each host organization makes its own acceptance and placement decisions.",
      },
      {
        id: "application-waitlist",
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
        id: "partner-inquiry",
        question: "How can an organization work with Future Physicians?",
        answer:
          "Hospitals, clinics, universities, research programs, schools, and community organizations can contact outreach@futurephysicians.org. FP reviews the organization and proposed collaboration before approving access or publishing an opportunity.",
      },
      {
        id: "organization-verification",
        question: "How does FP verify organizations?",
        answer:
          "FP reviews organization and source information before publishing a listing. Verification records that review; it is not an endorsement, a guarantee of program quality, or a promise of a student outcome.",
      },
      {
        id: "partner-data-access",
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
        id: "chapter-application",
        question: "Can my school start a chapter?",
        answer:
          "Students can apply to start or join a chapter. Approval is not automatic, and chapters are responsible for active leadership, accurate communication, and coordination with the national organization.",
      },
      {
        id: "chapter-funding",
        question: "Does every chapter receive funding?",
        answer:
          "No. Chapter approval does not guarantee funding, exclusive opportunities, hospital access, or participation in every national program.",
      },
      {
        id: "event-recordings",
        question: "Where are event recordings available?",
        answer:
          "Completed events with approved recordings are listed on the Events page. Upcoming events show registration details only while registration is active.",
      },
      {
        id: "upcoming-events",
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
        id: "profile-visibility",
        question: "Who can see my profile?",
        answer:
          "Your profile is not a public page. Access is limited by role and application context, and partners may see only information authorized for the opportunities they manage.",
      },
      {
        id: "incorrect-information",
        question: "How do I report incorrect information?",
        answer:
          "Signed-in students can report a broken link, incorrect deadline, eligibility issue, or closed program from the opportunity workspace. You can also email support@futurephysicians.org.",
      },
      {
        id: "support-contact",
        question: "How do I contact support?",
        answer:
          "Email support@futurephysicians.org for account, application, opportunity, or general questions, or use the Contact page to find the partnerships and fundraising addresses. Do not include sensitive profile or document details in an initial email.",
      },
    ],
  },
] as const;

export const allFaqItems = faqGroups.flatMap((group) => [...group.items]);

type FaqItemId = (typeof allFaqItems)[number]["id"];

const faqItemsById = new Map(
  allFaqItems.map((item) => [item.id, item] as const),
);

function selectFaqItems(ids: readonly FaqItemId[]) {
  return ids.map((id) => {
    const item = faqItemsById.get(id);
    if (!item) {
      throw new Error(`Unknown FAQ id: ${id}`);
    }
    return item;
  });
}

export const homepageFaqItems = selectFaqItems([
  "student-dashboard-free",
  "student-profile-eligibility",
  "opportunity-verification",
  "placement-guarantee",
  "application-process",
  "partner-inquiry",
]);

export const studentFaqItems = selectFaqItems([
  "student-profile-eligibility",
  "recommendation-eligibility",
  "application-process",
]);

export const partnerFaqItems = selectFaqItems([
  "partner-inquiry",
  "organization-verification",
  "partner-data-access",
]);
