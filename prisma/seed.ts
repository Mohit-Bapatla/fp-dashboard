import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const fallbackDatabaseUrl =
  "postgresql://USER:PASSWORD@localhost:5432/fp_dashboard?schema=public";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? fallbackDatabaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

const demoClerkIds = {
  admin: "user_demo_admin_001",
  partner: "user_demo_partner_001",
  staff: "user_demo_staff_001",
  student: "user_demo_student_001",
};

async function seedUsers() {
  const student = await prisma.user.upsert({
    where: { clerkUserId: demoClerkIds.student },
    update: {
      email: "demo-student@example.com",
      firstName: "Demo",
      lastName: "Student",
      role: "STUDENT",
    },
    create: {
      id: "user_demo_student",
      clerkUserId: demoClerkIds.student,
      email: "demo-student@example.com",
      firstName: "Demo",
      lastName: "Student",
      role: "STUDENT",
    },
  });
  const partner = await prisma.user.upsert({
    where: { clerkUserId: demoClerkIds.partner },
    update: {
      email: "demo-partner@example.com",
      firstName: "Demo",
      lastName: "Partner",
      role: "PARTNER",
    },
    create: {
      id: "user_demo_partner",
      clerkUserId: demoClerkIds.partner,
      email: "demo-partner@example.com",
      firstName: "Demo",
      lastName: "Partner",
      role: "PARTNER",
    },
  });
  const staff = await prisma.user.upsert({
    where: { clerkUserId: demoClerkIds.staff },
    update: {
      email: "demo-staff@example.com",
      firstName: "Demo",
      lastName: "Staff",
      role: "STAFF",
    },
    create: {
      id: "user_demo_staff",
      clerkUserId: demoClerkIds.staff,
      email: "demo-staff@example.com",
      firstName: "Demo",
      lastName: "Staff",
      role: "STAFF",
    },
  });
  const admin = await prisma.user.upsert({
    where: { clerkUserId: demoClerkIds.admin },
    update: {
      email: "demo-admin@example.com",
      firstName: "Demo",
      lastName: "Admin",
      role: "ADMIN",
    },
    create: {
      id: "user_demo_admin",
      clerkUserId: demoClerkIds.admin,
      email: "demo-admin@example.com",
      firstName: "Demo",
      lastName: "Admin",
      role: "ADMIN",
    },
  });
  return {
    admin,
    partner,
    staff,
    student,
  };
}

async function seedDemoData() {
  const { admin, partner, staff, student } = await seedUsers();
  const studentProfile = await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: {
      availability: ["Weekday afternoons", "Saturday mornings"],
      bio: "Fake demo profile for local walkthroughs only.",
      careerGoals: "Explore healthcare careers through safe demo workflows.",
      city: "Demo City",
      country: "United States",
      experienceLevel: "Beginner",
      gradeYear: "11th grade",
      graduationYear: 2027,
      interestedSpecialties: ["Cardiology", "Public Health"],
      languages: ["English"],
      locationPreference: "Demo City",
      major: "Biology",
      opportunityTypes: ["SHADOWING", "RESEARCH", "VOLUNTEERING"],
      remotePreference: "Hybrid",
      school: "Demo High School",
      state: "TX",
      ageYears: 16,
      maximumTravelMiles: 25,
      paidOnlyPreference: false,
      preferredSeasons: ["Summer", "Fall"],
      certifications: ["Demo CPR"],
      transportationNotes: "Fake demo transportation note.",
    },
    create: {
      id: "student_profile_demo",
      userId: student.id,
      availability: ["Weekday afternoons", "Saturday mornings"],
      bio: "Fake demo profile for local walkthroughs only.",
      careerGoals: "Explore healthcare careers through safe demo workflows.",
      city: "Demo City",
      country: "United States",
      experienceLevel: "Beginner",
      gradeYear: "11th grade",
      graduationYear: 2027,
      interestedSpecialties: ["Cardiology", "Public Health"],
      languages: ["English"],
      locationPreference: "Demo City",
      major: "Biology",
      opportunityTypes: ["SHADOWING", "RESEARCH", "VOLUNTEERING"],
      remotePreference: "Hybrid",
      school: "Demo High School",
      state: "TX",
      ageYears: 16,
      maximumTravelMiles: 25,
      paidOnlyPreference: false,
      preferredSeasons: ["Summer", "Fall"],
      certifications: ["Demo CPR"],
      transportationNotes: "Fake demo transportation note.",
    },
  });

  const resume = await prisma.resume.upsert({
    where: { id: "resume_demo_student" },
    update: {
      extractedCertifications: ["Demo HIPAA orientation confirmation"],
      extractedEducation: ["Demo High School, expected 2027"],
      extractedExperience: ["Volunteered at a simulated community health fair"],
      extractedSkills: [
        "Communication",
        "Spreadsheet tracking",
        "Research notes",
      ],
      fileName: "demo-resume-placeholder.pdf",
      fileUrl: "demo/metadata-only/no-real-file.pdf",
      parseStatus: "COMPLETED",
      parsedSummary:
        "Fake resume metadata for demo mode. No real resume file is stored.",
      parsedText:
        "Demo-only resume text. This is synthetic and contains no private student data.",
      studentProfileId: studentProfile.id,
    },
    create: {
      id: "resume_demo_student",
      extractedCertifications: ["Demo HIPAA orientation confirmation"],
      extractedEducation: ["Demo High School, expected 2027"],
      extractedExperience: ["Volunteered at a simulated community health fair"],
      extractedSkills: [
        "Communication",
        "Spreadsheet tracking",
        "Research notes",
      ],
      fileName: "demo-resume-placeholder.pdf",
      fileUrl: "demo/metadata-only/no-real-file.pdf",
      parseStatus: "COMPLETED",
      parsedSummary:
        "Fake resume metadata for demo mode. No real resume file is stored.",
      parsedText:
        "Demo-only resume text. This is synthetic and contains no private student data.",
      studentProfileId: studentProfile.id,
    },
  });

  const hospital = await prisma.partnerOrganization.upsert({
    where: { name: "Demo Community Hospital" },
    update: {
      city: "Demo City",
      contactEmail: "demo-partner@example.com",
      country: "United States",
      description: "Fake partner organization for demo workflows.",
      healthcareFocus: "Primary care and student shadowing",
      location: "Demo City, TX",
      specialtyAreas: ["Primary Care", "Cardiology"],
      state: "TX",
      status: "PARTNERED",
      type: "Hospital",
      verificationChecklist: [
        "Demo affiliation reviewed",
        "Demo contact confirmed",
      ],
      verificationNotes: "Synthetic verification notes for beta demos.",
      verificationStatus: "VERIFIED",
      verifiedAt: new Date("2026-02-01T14:00:00.000Z"),
      verifiedById: admin.id,
      website: "https://example.com/demo-community-hospital",
    },
    create: {
      id: "partner_org_demo_hospital",
      city: "Demo City",
      contactEmail: "demo-partner@example.com",
      country: "United States",
      description: "Fake partner organization for demo workflows.",
      healthcareFocus: "Primary care and student shadowing",
      location: "Demo City, TX",
      name: "Demo Community Hospital",
      specialtyAreas: ["Primary Care", "Cardiology"],
      state: "TX",
      status: "PARTNERED",
      type: "Hospital",
      verificationChecklist: [
        "Demo affiliation reviewed",
        "Demo contact confirmed",
      ],
      verificationNotes: "Synthetic verification notes for beta demos.",
      verificationStatus: "VERIFIED",
      verifiedAt: new Date("2026-02-01T14:00:00.000Z"),
      verifiedById: admin.id,
      website: "https://example.com/demo-community-hospital",
    },
  });
  const clinic = await prisma.partnerOrganization.upsert({
    where: { name: "Demo Family Clinic" },
    update: {
      city: "Demo City",
      contactEmail: "demo-clinic-contact@example.com",
      description: "Fake prospective partner for outreach workflows.",
      healthcareFocus: "Family medicine and community health",
      location: "Demo City, TX",
      nextFollowUpAt: new Date("2026-06-01T15:00:00.000Z"),
      specialtyAreas: ["Family Medicine", "Public Health"],
      state: "TX",
      status: "FOLLOW_UP_NEEDED",
      type: "Clinic",
      verificationStatus: "IN_REVIEW",
      website: "https://example.com/demo-family-clinic",
    },
    create: {
      id: "partner_org_demo_clinic",
      city: "Demo City",
      contactEmail: "demo-clinic-contact@example.com",
      description: "Fake prospective partner for outreach workflows.",
      healthcareFocus: "Family medicine and community health",
      location: "Demo City, TX",
      name: "Demo Family Clinic",
      nextFollowUpAt: new Date("2026-06-01T15:00:00.000Z"),
      specialtyAreas: ["Family Medicine", "Public Health"],
      state: "TX",
      status: "FOLLOW_UP_NEEDED",
      type: "Clinic",
      verificationStatus: "IN_REVIEW",
      website: "https://example.com/demo-family-clinic",
    },
  });

  await prisma.partnerMember.upsert({
    where: {
      userId_organizationId: {
        organizationId: hospital.id,
        userId: partner.id,
      },
    },
    update: {
      isPrimary: true,
      title: "Demo Program Coordinator",
    },
    create: {
      id: "partner_member_demo_primary",
      organizationId: hospital.id,
      userId: partner.id,
      isPrimary: true,
      title: "Demo Program Coordinator",
    },
  });

  const shadowing = await prisma.opportunity.upsert({
    where: { id: "opportunity_demo_shadowing" },
    update: {
      applicationInstructions:
        "Submit a short demo statement and choose the placeholder resume.",
      capacity: 8,
      deadline: new Date("2026-09-15T23:59:00.000Z"),
      description:
        "Observe a simulated primary care workflow in a fake demo setting.",
      eligibilityRequirements:
        "Open to demo students interested in primary care.",
      location: "Demo City, TX",
      paidStatus: "Unpaid",
      publishedAt: new Date("2026-01-15T12:00:00.000Z"),
      remoteType: "In person",
      requiredDocuments: ["Resume confirmation", "Demo orientation checklist"],
      specialty: "Primary Care",
      status: "PUBLISHED",
      title: "Primary Care Shadowing Rotation",
      type: "SHADOWING",
      relationshipType: "FP_OWNED",
      officialSourceUrl: "https://example.org/future-physicians-demo-shadowing",
      officialApplicationUrl: "https://example.org/future-physicians-demo-shadowing/apply",
      verificationStatus: "VERIFIED",
      lastVerifiedAt: new Date("2026-07-01T12:00:00.000Z"),
      availabilityStatus: "OPEN",
      acceptedGradeLevels: ["11th grade", "12th grade"],
      minimumAge: 15,
    },
    create: {
      id: "opportunity_demo_shadowing",
      applicationInstructions:
        "Submit a short demo statement and choose the placeholder resume.",
      capacity: 8,
      deadline: new Date("2026-09-15T23:59:00.000Z"),
      description:
        "Observe a simulated primary care workflow in a fake demo setting.",
      eligibilityRequirements:
        "Open to demo students interested in primary care.",
      location: "Demo City, TX",
      organizationId: hospital.id,
      paidStatus: "Unpaid",
      publishedAt: new Date("2026-01-15T12:00:00.000Z"),
      remoteType: "In person",
      requiredDocuments: ["Resume confirmation", "Demo orientation checklist"],
      specialty: "Primary Care",
      status: "PUBLISHED",
      title: "Primary Care Shadowing Rotation",
      type: "SHADOWING",
      relationshipType: "FP_OWNED",
      officialSourceUrl: "https://example.org/future-physicians-demo-shadowing",
      officialApplicationUrl: "https://example.org/future-physicians-demo-shadowing/apply",
      verificationStatus: "VERIFIED",
      lastVerifiedAt: new Date("2026-07-01T12:00:00.000Z"),
      availabilityStatus: "OPEN",
      acceptedGradeLevels: ["11th grade", "12th grade"],
      minimumAge: 15,
    },
  });
  await prisma.opportunity.upsert({
    where: { id: "opportunity_demo_research" },
    update: {
      applicationInstructions:
        "Demo applicants should describe research interests.",
      capacity: 4,
      deadline: new Date("2026-10-01T23:59:00.000Z"),
      description:
        "Assist with a fake community health research workflow for seed data.",
      eligibilityRequirements:
        "Beginner-friendly; no real patient data involved.",
      location: "Hybrid",
      paidStatus: "Unpaid",
      remoteType: "Hybrid",
      specialty: "Public Health",
      status: "PENDING_APPROVAL",
      title: "Community Health Research Program",
      type: "RESEARCH",
    },
    create: {
      id: "opportunity_demo_research",
      applicationInstructions:
        "Demo applicants should describe research interests.",
      capacity: 4,
      deadline: new Date("2026-10-01T23:59:00.000Z"),
      description:
        "Assist with a fake community health research workflow for seed data.",
      eligibilityRequirements:
        "Beginner-friendly; no real patient data involved.",
      location: "Hybrid",
      organizationId: clinic.id,
      paidStatus: "Unpaid",
      remoteType: "Hybrid",
      specialty: "Public Health",
      status: "PENDING_APPROVAL",
      title: "Community Health Research Program",
      type: "RESEARCH",
    },
  });

  const application = await prisma.application.upsert({
    where: {
      studentProfileId_opportunityId: {
        opportunityId: shadowing.id,
        studentProfileId: studentProfile.id,
      },
    },
    update: {
      resumeId: resume.id,
      reviewedAt: new Date("2026-02-04T16:00:00.000Z"),
      statement:
        "Demo-only application statement. This is synthetic walkthrough data.",
      status: "INTERVIEW",
      submittedAt: new Date("2026-02-01T15:00:00.000Z"),
    },
    create: {
      id: "application_demo_shadowing",
      opportunityId: shadowing.id,
      resumeId: resume.id,
      reviewedAt: new Date("2026-02-04T16:00:00.000Z"),
      statement:
        "Demo-only application statement. This is synthetic walkthrough data.",
      status: "INTERVIEW",
      studentProfileId: studentProfile.id,
      submittedAt: new Date("2026-02-01T15:00:00.000Z"),
    },
  });

  await Promise.all([
    prisma.applicationOnboardingItem.upsert({
      where: {
        applicationId_title: {
          applicationId: application.id,
          title: "Resume confirmation",
        },
      },
      update: {
        reviewerId: admin.id,
        reviewerNotes: "Synthetic confirmation accepted for demo.",
        status: "APPROVED",
        studentNotes: "Demo student confirms placeholder resume metadata.",
      },
      create: {
        applicationId: application.id,
        reviewerId: admin.id,
        reviewerNotes: "Synthetic confirmation accepted for demo.",
        status: "APPROVED",
        studentNotes: "Demo student confirms placeholder resume metadata.",
        title: "Resume confirmation",
      },
    }),
    prisma.applicationOnboardingItem.upsert({
      where: {
        applicationId_title: {
          applicationId: application.id,
          title: "Demo orientation checklist",
        },
      },
      update: {
        description: "Metadata-only onboarding item for demos.",
        status: "SUBMITTED",
        studentNotes: "Demo orientation reviewed.",
      },
      create: {
        applicationId: application.id,
        description: "Metadata-only onboarding item for demos.",
        status: "SUBMITTED",
        studentNotes: "Demo orientation reviewed.",
        title: "Demo orientation checklist",
      },
    }),
  ]);

  const placementRequest = await prisma.placementRequest.upsert({
    where: { id: "placement_request_demo_shadowing" },
    update: {
      assignedStaffId: staff.id,
      availability: ["Saturday mornings"],
      description: "Fake placement request used to exercise seeded relations.",
      locationPreference: "Demo City",
      notes: "No real student data.",
      opportunityId: shadowing.id,
      partnerOrganizationId: hospital.id,
      priority: "NORMAL",
      remotePreference: "In person",
      requestedById: staff.id,
      requestedOpportunityTypes: ["SHADOWING"],
      requestedSpecialties: ["Primary Care"],
      status: "STUDENT_REFERRED",
      title: "Find a primary care shadowing slot",
    },
    create: {
      id: "placement_request_demo_shadowing",
      assignedStaffId: staff.id,
      availability: ["Saturday mornings"],
      description: "Fake placement request used to exercise seeded relations.",
      locationPreference: "Demo City",
      notes: "No real student data.",
      opportunityId: shadowing.id,
      partnerOrganizationId: hospital.id,
      priority: "NORMAL",
      remotePreference: "In person",
      requestedById: staff.id,
      requestedOpportunityTypes: ["SHADOWING"],
      requestedSpecialties: ["Primary Care"],
      status: "STUDENT_REFERRED",
      studentProfileId: studentProfile.id,
      title: "Find a primary care shadowing slot",
    },
  });

  const contact = await prisma.outreachContact.upsert({
    where: { id: "outreach_contact_demo_clinic" },
    update: {
      email: "demo-clinic-contact@example.com",
      firstName: "Demo",
      lastContactedAt: new Date("2026-02-10T16:00:00.000Z"),
      lastName: "Contact",
      nextFollowUpAt: new Date("2026-06-01T15:00:00.000Z"),
      notes: "Fake outreach contact.",
      organizationId: clinic.id,
      phone: "555-0100",
      title: "Demo Clinic Manager",
    },
    create: {
      id: "outreach_contact_demo_clinic",
      email: "demo-clinic-contact@example.com",
      firstName: "Demo",
      lastContactedAt: new Date("2026-02-10T16:00:00.000Z"),
      lastName: "Contact",
      nextFollowUpAt: new Date("2026-06-01T15:00:00.000Z"),
      notes: "Fake outreach contact.",
      organizationId: clinic.id,
      phone: "555-0100",
      title: "Demo Clinic Manager",
    },
  });

  await prisma.outreachTask.upsert({
    where: { id: "outreach_task_demo_follow_up" },
    update: {
      assignedToId: staff.id,
      contactId: contact.id,
      createdById: admin.id,
      description: "Demo outreach task for local walkthroughs.",
      dueAt: new Date("2026-06-01T17:00:00.000Z"),
      partnerOrganizationId: clinic.id,
      placementRequestId: placementRequest.id,
      priority: "NORMAL",
      status: "IN_PROGRESS",
      title: "Follow up on research partnership",
    },
    create: {
      id: "outreach_task_demo_follow_up",
      assignedToId: staff.id,
      contactId: contact.id,
      createdById: admin.id,
      description: "Demo outreach task for local walkthroughs.",
      dueAt: new Date("2026-06-01T17:00:00.000Z"),
      partnerOrganizationId: clinic.id,
      placementRequestId: placementRequest.id,
      priority: "NORMAL",
      status: "IN_PROGRESS",
      title: "Follow up on research partnership",
    },
  });

  const interview = await prisma.interviewRequest.upsert({
    where: { id: "interview_request_demo_shadowing" },
    update: {
      applicationId: application.id,
      createdById: partner.id,
      location: "Demo Community Hospital, Education Room",
      meetingLink: "https://example.com/demo-interview",
      notes: "Synthetic interview request for partner review demos.",
      scheduledAt: new Date("2026-02-12T18:00:00.000Z"),
      status: "SCHEDULED",
      studentResponseNotes: "Demo student selected the first proposed slot.",
    },
    create: {
      id: "interview_request_demo_shadowing",
      applicationId: application.id,
      createdById: partner.id,
      location: "Demo Community Hospital, Education Room",
      meetingLink: "https://example.com/demo-interview",
      notes: "Synthetic interview request for partner review demos.",
      scheduledAt: new Date("2026-02-12T18:00:00.000Z"),
      status: "SCHEDULED",
      studentResponseNotes: "Demo student selected the first proposed slot.",
    },
  });

  const selectedSlot = await prisma.proposedInterviewSlot.upsert({
    where: { id: "interview_slot_demo_shadowing_1" },
    update: {
      endsAt: new Date("2026-02-12T18:30:00.000Z"),
      interviewRequestId: interview.id,
      selected: true,
      startsAt: new Date("2026-02-12T18:00:00.000Z"),
    },
    create: {
      id: "interview_slot_demo_shadowing_1",
      endsAt: new Date("2026-02-12T18:30:00.000Z"),
      interviewRequestId: interview.id,
      selected: true,
      startsAt: new Date("2026-02-12T18:00:00.000Z"),
    },
  });
  await prisma.proposedInterviewSlot.upsert({
    where: { id: "interview_slot_demo_shadowing_2" },
    update: {
      endsAt: new Date("2026-02-13T18:30:00.000Z"),
      interviewRequestId: interview.id,
      selected: false,
      startsAt: new Date("2026-02-13T18:00:00.000Z"),
    },
    create: {
      id: "interview_slot_demo_shadowing_2",
      endsAt: new Date("2026-02-13T18:30:00.000Z"),
      interviewRequestId: interview.id,
      selected: false,
      startsAt: new Date("2026-02-13T18:00:00.000Z"),
    },
  });
  await prisma.interviewRequest.update({
    where: { id: interview.id },
    data: {
      selectedSlotId: selectedSlot.id,
    },
  });

  await prisma.serviceHourRecord.upsert({
    where: { id: "service_hour_demo_shadowing" },
    update: {
      applicationId: application.id,
      approvedAt: new Date("2026-03-10T18:00:00.000Z"),
      approvedById: admin.id,
      certificateNotes: "Certificate metadata approved for demo only.",
      certificateStatus: "APPROVED",
      description: "Fake verified service hours for the shadowing demo.",
      hours: 6,
      opportunityId: shadowing.id,
      partnerOrganizationId: hospital.id,
      studentProfileId: studentProfile.id,
      verificationNotes: "Partner verified fake demo hours.",
      verificationStatus: "VERIFIED",
      verifiedAt: new Date("2026-03-09T18:00:00.000Z"),
      verifiedById: partner.id,
    },
    create: {
      id: "service_hour_demo_shadowing",
      applicationId: application.id,
      approvedAt: new Date("2026-03-10T18:00:00.000Z"),
      approvedById: admin.id,
      certificateNotes: "Certificate metadata approved for demo only.",
      certificateStatus: "APPROVED",
      description: "Fake verified service hours for the shadowing demo.",
      hours: 6,
      opportunityId: shadowing.id,
      partnerOrganizationId: hospital.id,
      studentProfileId: studentProfile.id,
      verificationNotes: "Partner verified fake demo hours.",
      verificationStatus: "VERIFIED",
      verifiedAt: new Date("2026-03-09T18:00:00.000Z"),
      verifiedById: partner.id,
    },
  });

  const event = await prisma.programEvent.upsert({
    where: { id: "program_event_demo_seminar" },
    update: {
      capacity: 25,
      createdById: staff.id,
      description:
        "Synthetic seminar for showing event registration and attendance flows.",
      eventType: "SEMINAR",
      location: "Demo Community Center",
      registrationDeadline: new Date("2026-07-10T23:59:00.000Z"),
      speakerNames: ["Demo Speaker"],
      startAt: new Date("2026-07-15T18:00:00.000Z"),
      endAt: new Date("2026-07-15T19:30:00.000Z"),
      status: "PUBLISHED",
      title: "Demo Healthcare Careers Seminar",
      virtualLink: "https://example.com/demo-event",
    },
    create: {
      id: "program_event_demo_seminar",
      capacity: 25,
      createdById: staff.id,
      description:
        "Synthetic seminar for showing event registration and attendance flows.",
      eventType: "SEMINAR",
      location: "Demo Community Center",
      registrationDeadline: new Date("2026-07-10T23:59:00.000Z"),
      speakerNames: ["Demo Speaker"],
      startAt: new Date("2026-07-15T18:00:00.000Z"),
      endAt: new Date("2026-07-15T19:30:00.000Z"),
      status: "PUBLISHED",
      title: "Demo Healthcare Careers Seminar",
      virtualLink: "https://example.com/demo-event",
    },
  });
  await prisma.eventRegistration.upsert({
    where: {
      eventId_studentProfileId: {
        eventId: event.id,
        studentProfileId: studentProfile.id,
      },
    },
    update: {
      certificateStatus: "PENDING_APPROVAL",
      status: "REGISTERED",
    },
    create: {
      eventId: event.id,
      certificateStatus: "PENDING_APPROVAL",
      status: "REGISTERED",
      studentProfileId: studentProfile.id,
    },
  });

  const sponsor = await prisma.sponsorOrganization.upsert({
    where: { name: "Demo Health Foundation" },
    update: {
      contactEmail: "demo-sponsor@example.com",
      description: "Fake sponsor organization for funding workflow demos.",
      donationUrl: "https://example.com/demo-donate",
      location: "Demo City, TX",
      status: "COMMITTED",
      website: "https://example.com/demo-health-foundation",
    },
    create: {
      id: "sponsor_org_demo_foundation",
      contactEmail: "demo-sponsor@example.com",
      description: "Fake sponsor organization for funding workflow demos.",
      donationUrl: "https://example.com/demo-donate",
      location: "Demo City, TX",
      name: "Demo Health Foundation",
      status: "COMMITTED",
      website: "https://example.com/demo-health-foundation",
    },
  });
  const sponsorContact = await prisma.sponsorContact.upsert({
    where: { id: "sponsor_contact_demo_foundation" },
    update: {
      email: "demo-sponsor@example.com",
      firstName: "Demo",
      lastName: "Sponsor",
      sponsorOrganizationId: sponsor.id,
      title: "Demo Foundation Contact",
    },
    create: {
      id: "sponsor_contact_demo_foundation",
      email: "demo-sponsor@example.com",
      firstName: "Demo",
      lastName: "Sponsor",
      sponsorOrganizationId: sponsor.id,
      title: "Demo Foundation Contact",
    },
  });
  const campaign = await prisma.sponsorshipCampaign.upsert({
    where: { id: "sponsorship_campaign_demo" },
    update: {
      description: "Fake campaign for scholarship and event support demos.",
      goalAmountCents: 250000,
      name: "Demo Student Access Fund",
      status: "ACTIVE",
    },
    create: {
      id: "sponsorship_campaign_demo",
      description: "Fake campaign for scholarship and event support demos.",
      goalAmountCents: 250000,
      name: "Demo Student Access Fund",
      status: "ACTIVE",
    },
  });
  const commitment = await prisma.sponsorshipCommitment.upsert({
    where: { id: "sponsorship_commitment_demo" },
    update: {
      amountCents: 50000,
      campaignId: campaign.id,
      committedAt: new Date("2026-04-01T15:00:00.000Z"),
      notes: "Fake pledged commitment for sponsor workflow demo.",
      sponsorOrganizationId: sponsor.id,
      status: "COMMITTED",
    },
    create: {
      id: "sponsorship_commitment_demo",
      amountCents: 50000,
      campaignId: campaign.id,
      committedAt: new Date("2026-04-01T15:00:00.000Z"),
      notes: "Fake pledged commitment for sponsor workflow demo.",
      sponsorOrganizationId: sponsor.id,
      status: "COMMITTED",
    },
  });
  await prisma.sponsorDeliverable.upsert({
    where: { id: "sponsor_deliverable_demo_logo" },
    update: {
      commitmentId: commitment.id,
      dueAt: new Date("2026-08-01T15:00:00.000Z"),
      notes: "Fake logo placement deliverable.",
      status: "TODO",
      type: "LOGO_PLACEMENT",
    },
    create: {
      id: "sponsor_deliverable_demo_logo",
      commitmentId: commitment.id,
      dueAt: new Date("2026-08-01T15:00:00.000Z"),
      notes: "Fake logo placement deliverable.",
      status: "TODO",
      type: "LOGO_PLACEMENT",
    },
  });
  await prisma.sponsorInteraction.upsert({
    where: { id: "sponsor_interaction_demo" },
    update: {
      authorId: staff.id,
      body: "Synthetic sponsor note for demo mode.",
      contactId: sponsorContact.id,
      occurredAt: new Date("2026-04-02T15:00:00.000Z"),
      sponsorOrganizationId: sponsor.id,
      type: "NOTE",
    },
    create: {
      id: "sponsor_interaction_demo",
      authorId: staff.id,
      body: "Synthetic sponsor note for demo mode.",
      contactId: sponsorContact.id,
      occurredAt: new Date("2026-04-02T15:00:00.000Z"),
      sponsorOrganizationId: sponsor.id,
      type: "NOTE",
    },
  });

  await Promise.all([
    prisma.feedback.upsert({
      where: {
        authorId_feedbackType_entityType_entityId: {
          authorId: student.id,
          entityId: application.id,
          entityType: "APPLICATION",
          feedbackType: "STUDENT_APPLICATION_EXPERIENCE",
        },
      },
      update: {
        notes: "Demo student found the application flow clear.",
        rating: 5,
      },
      create: {
        authorId: student.id,
        entityId: application.id,
        entityType: "APPLICATION",
        feedbackType: "STUDENT_APPLICATION_EXPERIENCE",
        notes: "Demo student found the application flow clear.",
        rating: 5,
      },
    }),
    prisma.feedback.upsert({
      where: {
        authorId_feedbackType_entityType_entityId: {
          authorId: partner.id,
          entityId: application.id,
          entityType: "APPLICATION",
          feedbackType: "PARTNER_REVIEW_USEFULNESS",
        },
      },
      update: {
        notes: "Demo partner review summary was useful.",
        rating: 4,
      },
      create: {
        authorId: partner.id,
        entityId: application.id,
        entityType: "APPLICATION",
        feedbackType: "PARTNER_REVIEW_USEFULNESS",
        notes: "Demo partner review summary was useful.",
        rating: 4,
      },
    }),
    prisma.recommendationEvent.upsert({
      where: { id: "recommendation_event_demo_impression" },
      update: {
        eventType: "IMPRESSION",
        matchScore: 86,
        opportunityId: shadowing.id,
        source: "demo_seed",
        userId: student.id,
      },
      create: {
        id: "recommendation_event_demo_impression",
        eventType: "IMPRESSION",
        matchScore: 86,
        opportunityId: shadowing.id,
        source: "demo_seed",
        userId: student.id,
      },
    }),
    prisma.recommendationEvent.upsert({
      where: { id: "recommendation_event_demo_click" },
      update: {
        eventType: "CLICK",
        matchScore: 86,
        opportunityId: shadowing.id,
        source: "demo_seed",
        userId: student.id,
      },
      create: {
        id: "recommendation_event_demo_click",
        eventType: "CLICK",
        matchScore: 86,
        opportunityId: shadowing.id,
        source: "demo_seed",
        userId: student.id,
      },
    }),
    prisma.recommendationEvent.upsert({
      where: { id: "recommendation_event_demo_application" },
      update: {
        applicationId: application.id,
        eventType: "APPLICATION",
        matchScore: 86,
        opportunityId: shadowing.id,
        source: "demo_seed",
        userId: student.id,
      },
      create: {
        id: "recommendation_event_demo_application",
        applicationId: application.id,
        eventType: "APPLICATION",
        matchScore: 86,
        opportunityId: shadowing.id,
        source: "demo_seed",
        userId: student.id,
      },
    }),
    prisma.notification.upsert({
      where: { id: "notification_demo_student" },
      update: {
        body: "Your demo application has a scheduled interview.",
        title: "Demo interview scheduled",
        userId: student.id,
      },
      create: {
        id: "notification_demo_student",
        body: "Your demo application has a scheduled interview.",
        title: "Demo interview scheduled",
        userId: student.id,
      },
    }),
    prisma.notification.upsert({
      where: { id: "notification_demo_staff" },
      update: {
        body: "A demo outreach follow-up is due soon.",
        title: "Demo outreach reminder",
        userId: staff.id,
      },
      create: {
        id: "notification_demo_staff",
        body: "A demo outreach follow-up is due soon.",
        title: "Demo outreach reminder",
        userId: staff.id,
      },
    }),
    prisma.notification.upsert({
      where: { id: "notification_demo_partner" },
      update: {
        body: "A demo student selected an interview slot.",
        title: "Demo applicant response",
        userId: partner.id,
      },
      create: {
        id: "notification_demo_partner",
        body: "A demo student selected an interview slot.",
        title: "Demo applicant response",
        userId: partner.id,
      },
    }),
    prisma.notification.upsert({
      where: { id: "notification_demo_admin" },
      update: {
        body: "Demo seed data is available for local walkthroughs.",
        title: "Demo workspace ready",
        userId: admin.id,
      },
      create: {
        id: "notification_demo_admin",
        body: "Demo seed data is available for local walkthroughs.",
        title: "Demo workspace ready",
        userId: admin.id,
      },
    }),
    prisma.adminNote.upsert({
      where: { id: "admin_note_demo_student" },
      update: {
        authorId: admin.id,
        body: "Fake admin note for development seed data only.",
        studentProfileId: studentProfile.id,
        userId: student.id,
      },
      create: {
        id: "admin_note_demo_student",
        authorId: admin.id,
        body: "Fake admin note for development seed data only.",
        studentProfileId: studentProfile.id,
        userId: student.id,
      },
    }),
    prisma.auditLog.upsert({
      where: { id: "audit_log_demo_seed" },
      update: {
        action: "DEMO_SEED_CREATED",
        actorId: admin.id,
        entityId: "batch_l_demo_seed",
        entityType: "System",
        metadata: {
          includesRealStudentData: false,
          source: "prisma/seed.ts",
        },
      },
      create: {
        id: "audit_log_demo_seed",
        action: "DEMO_SEED_CREATED",
        actorId: admin.id,
        entityId: "batch_l_demo_seed",
        entityType: "System",
        metadata: {
          includesRealStudentData: false,
          source: "prisma/seed.ts",
        },
      },
    }),
  ]);
}

seedDemoData()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
