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

async function main() {
  const student = await prisma.user.upsert({
    where: { clerkUserId: "user_demo_student_001" },
    update: {},
    create: {
      id: "user_demo_student",
      clerkUserId: "user_demo_student_001",
      email: "student.demo@example.com",
      firstName: "Demo",
      lastName: "Student",
      role: "STUDENT",
    },
  });

  const partner = await prisma.user.upsert({
    where: { clerkUserId: "user_demo_partner_001" },
    update: {},
    create: {
      id: "user_demo_partner",
      clerkUserId: "user_demo_partner_001",
      email: "partner.demo@example.com",
      firstName: "Demo",
      lastName: "Partner",
      role: "PARTNER",
    },
  });

  const staff = await prisma.user.upsert({
    where: { clerkUserId: "user_demo_staff_001" },
    update: {},
    create: {
      id: "user_demo_staff",
      clerkUserId: "user_demo_staff_001",
      email: "staff.demo@example.com",
      firstName: "Demo",
      lastName: "Staff",
      role: "STAFF",
    },
  });

  const admin = await prisma.user.upsert({
    where: { clerkUserId: "user_demo_admin_001" },
    update: {},
    create: {
      id: "user_demo_admin",
      clerkUserId: "user_demo_admin_001",
      email: "admin.demo@example.com",
      firstName: "Demo",
      lastName: "Admin",
      role: "ADMIN",
    },
  });

  const superAdmin = await prisma.user.upsert({
    where: { clerkUserId: "user_demo_super_admin_001" },
    update: {},
    create: {
      id: "user_demo_super_admin",
      clerkUserId: "user_demo_super_admin_001",
      email: "super.admin.demo@example.com",
      firstName: "Demo",
      lastName: "SuperAdmin",
      role: "SUPER_ADMIN",
    },
  });

  const studentProfile = await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      id: "student_profile_demo",
      userId: student.id,
      school: "Demo University",
      major: "Biology",
      graduationYear: 2027,
      bio: "Demo student profile for local development only.",
    },
  });

  await prisma.resume.upsert({
    where: { id: "resume_demo_student" },
    update: {},
    create: {
      id: "resume_demo_student",
      studentProfileId: studentProfile.id,
      fileName: "demo-student-resume.pdf",
      fileUrl: "https://example.com/demo-student-resume.pdf",
      parseStatus: "NOT_STARTED",
    },
  });

  const hospital = await prisma.partnerOrganization.upsert({
    where: { name: "Demo Community Hospital" },
    update: {},
    create: {
      id: "partner_org_demo_hospital",
      name: "Demo Community Hospital",
      status: "PARTNERED",
      website: "https://example.com/community-hospital",
      description: "Fake partner organization for development seed data.",
      city: "Chicago",
      state: "IL",
      healthcareFocus: "Primary care and hospital shadowing",
    },
  });

  const clinic = await prisma.partnerOrganization.upsert({
    where: { name: "Demo Family Clinic" },
    update: {},
    create: {
      id: "partner_org_demo_clinic",
      name: "Demo Family Clinic",
      status: "FOLLOW_UP_NEEDED",
      website: "https://example.com/family-clinic",
      description: "Fake prospective partner for outreach workflows.",
      city: "Evanston",
      state: "IL",
      healthcareFocus: "Family medicine",
    },
  });

  await prisma.partnerMember.upsert({
    where: {
      userId_organizationId: {
        userId: partner.id,
        organizationId: hospital.id,
      },
    },
    update: {},
    create: {
      id: "partner_member_demo_primary",
      userId: partner.id,
      organizationId: hospital.id,
      title: "Program Coordinator",
      isPrimary: true,
    },
  });

  const shadowing = await prisma.opportunity.upsert({
    where: { id: "opportunity_demo_shadowing" },
    update: {},
    create: {
      id: "opportunity_demo_shadowing",
      organizationId: hospital.id,
      title: "Primary Care Shadowing Rotation",
      description: "Observe care teams in a fake demo clinical setting.",
      type: "SHADOWING",
      status: "PUBLISHED",
      location: "Chicago, IL",
      capacity: 8,
      publishedAt: new Date("2026-01-15T12:00:00.000Z"),
    },
  });

  const research = await prisma.opportunity.upsert({
    where: { id: "opportunity_demo_research" },
    update: {},
    create: {
      id: "opportunity_demo_research",
      organizationId: clinic.id,
      title: "Community Health Research Program",
      description: "Assist with a fake research workflow for seed data.",
      type: "RESEARCH",
      status: "PENDING_APPROVAL",
      location: "Hybrid",
      capacity: 4,
    },
  });

  await prisma.application.upsert({
    where: {
      studentProfileId_opportunityId: {
        studentProfileId: studentProfile.id,
        opportunityId: shadowing.id,
      },
    },
    update: {},
    create: {
      id: "application_demo_shadowing",
      studentProfileId: studentProfile.id,
      opportunityId: shadowing.id,
      status: "SUBMITTED",
      statement: "Demo application statement for local development only.",
      submittedAt: new Date("2026-02-01T15:00:00.000Z"),
    },
  });

  await prisma.placementRequest.upsert({
    where: { id: "placement_request_demo_shadowing" },
    update: {},
    create: {
      id: "placement_request_demo_shadowing",
      studentProfileId: studentProfile.id,
      opportunityId: shadowing.id,
      partnerOrganizationId: hospital.id,
      requestedById: staff.id,
      status: "STUDENT_REFERRED",
      title: "Find a primary care shadowing slot",
      description: "Fake placement request used to exercise seeded relations.",
      notes: "No real student data.",
    },
  });

  const contact = await prisma.outreachContact.upsert({
    where: { id: "outreach_contact_demo_clinic" },
    update: {},
    create: {
      id: "outreach_contact_demo_clinic",
      organizationId: clinic.id,
      firstName: "Jordan",
      lastName: "Lee",
      email: "jordan.lee@example.com",
      phone: "555-0100",
      title: "Clinic Manager",
      notes: "Fake outreach contact.",
    },
  });

  await prisma.outreachTask.upsert({
    where: { id: "outreach_task_demo_follow_up" },
    update: {},
    create: {
      id: "outreach_task_demo_follow_up",
      contactId: contact.id,
      partnerOrganizationId: clinic.id,
      assignedToId: staff.id,
      createdById: admin.id,
      title: "Follow up on research partnership",
      description: "Demo outreach task for local development.",
      status: "IN_PROGRESS",
      dueAt: new Date("2026-03-01T17:00:00.000Z"),
    },
  });

  await prisma.notification.upsert({
    where: { id: "notification_demo_student" },
    update: {},
    create: {
      id: "notification_demo_student",
      userId: student.id,
      title: "Application received",
      body: "Your demo application has been received.",
    },
  });

  await prisma.adminNote.upsert({
    where: { id: "admin_note_demo_student" },
    update: {},
    create: {
      id: "admin_note_demo_student",
      authorId: admin.id,
      userId: student.id,
      studentProfileId: studentProfile.id,
      body: "Fake admin note for development seed data only.",
    },
  });

  await prisma.auditLog.upsert({
    where: { id: "audit_log_demo_seed" },
    update: {},
    create: {
      id: "audit_log_demo_seed",
      actorId: superAdmin.id,
      action: "DEMO_SEED_CREATED",
      entityType: "System",
      entityId: "stage_3_seed",
      metadata: {
        source: "prisma/seed.ts",
        includesRealStudentData: false,
        relatedOpportunityId: research.id,
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
