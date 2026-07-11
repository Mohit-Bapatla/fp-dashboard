import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BadgeDollarSign,
  BellRing,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ClipboardCheck,
  DatabaseZap,
  FileUp,
  FileClock,
  GraduationCap,
  Handshake,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  LockKeyhole,
  MailCheck,
  MessageSquareText,
  Medal,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
} from "lucide-react";

export type DashboardRole = "student" | "partner" | "staff" | "admin";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
  group?: string;
};

export type DashboardStat = {
  label: string;
  value: string;
  helper: string;
};

export type ComingSoonItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export const roleMeta: Record<
  DashboardRole,
  {
    label: string;
    eyebrow: string;
    accent: string;
    icon: LucideIcon;
  }
> = {
  student: {
    label: "Student",
    eyebrow: "Learner workspace",
    accent: "blue",
    icon: GraduationCap,
  },
  partner: {
    label: "Partner",
    eyebrow: "Organization workspace",
    accent: "sky",
    icon: Building2,
  },
  staff: {
    label: "Staff",
    eyebrow: "Operations workspace",
    accent: "indigo",
    icon: Users,
  },
  admin: {
    label: "Admin",
    eyebrow: "Platform workspace",
    accent: "rose",
    icon: ShieldCheck,
  },
};

export const roleNavigation: Record<DashboardRole, DashboardNavItem[]> = {
  student: [
    {
      label: "Overview",
      href: "/dashboard/student",
      icon: LayoutDashboard,
      active: true,
    },
    {
      label: "Notifications",
      href: "/dashboard/notifications",
      icon: BellRing,
    },
    {
      label: "Beta Guide",
      href: "/dashboard/student/beta",
      icon: Rocket,
    },
    {
      label: "Support",
      href: "/dashboard/support",
      icon: LifeBuoy,
    },
    {
      label: "Profile",
      href: "/dashboard/student/profile",
      icon: GraduationCap,
    },
    {
      label: "Opportunities",
      href: "/dashboard/student/opportunities",
      icon: BriefcaseBusiness,
    },
    {
      label: "Applications",
      href: "/dashboard/student/applications",
      icon: ClipboardCheck,
    },
    {
      label: "Placement Requests",
      href: "/dashboard/student/placement-requests",
      icon: FileClock,
    },
    {
      label: "Events",
      href: "/dashboard/student/events",
      icon: CalendarDays,
    },
    { label: "Saved", href: "/dashboard/student/saved", icon: Bookmark },
    { label: "Settings", href: "/dashboard/student/settings", icon: Settings },
  ],
  partner: [
    {
      label: "Overview",
      href: "/dashboard/partner",
      icon: LayoutDashboard,
      active: true,
    },
    {
      label: "Notifications",
      href: "/dashboard/notifications",
      icon: BellRing,
    },
    {
      label: "Beta Guide",
      href: "/dashboard/partner/beta",
      icon: Rocket,
    },
    {
      label: "Support",
      href: "/dashboard/support",
      icon: LifeBuoy,
    },
    {
      label: "Opportunities",
      href: "/dashboard/partner/opportunities",
      icon: BriefcaseBusiness,
    },
    {
      label: "Applicants",
      href: "/dashboard/partner/applicants",
      icon: Users,
    },
    {
      label: "Organization",
      href: "/dashboard/partner/organization",
      icon: Building2,
    },
    {
      label: "Analytics",
      href: "/dashboard/partner/analytics",
      icon: BarChart3,
    },
    {
      label: "Success",
      href: "/dashboard/partner/success",
      icon: Medal,
    },
    { label: "Settings", href: "/dashboard/partner/settings", icon: Settings },
  ],
  staff: [
    {
      label: "Overview",
      href: "/dashboard/staff",
      icon: LayoutDashboard,
      active: true,
    },
    {
      label: "Notifications",
      href: "/dashboard/notifications",
      icon: BellRing,
    },
    {
      label: "Launch",
      href: "/dashboard/staff/launch",
      icon: Rocket,
    },
    { label: "Partners", href: "/dashboard/staff/partners", icon: Building2 },
    { label: "Contacts", href: "/dashboard/staff/contacts", icon: Users },
    { label: "Outreach", href: "/dashboard/staff/outreach", icon: MailCheck },
    {
      label: "Assistant",
      href: "/dashboard/staff/outreach/assistant",
      icon: Sparkles,
    },
    { label: "Tasks", href: "/dashboard/staff/tasks", icon: ListChecks },
    {
      label: "Placement Requests",
      href: "/dashboard/staff/placement-requests",
      icon: FileClock,
    },
    {
      label: "Events",
      href: "/dashboard/staff/events",
      icon: CalendarDays,
    },
    {
      label: "Sponsors",
      href: "/dashboard/staff/sponsors",
      icon: Building2,
    },
    {
      label: "Sponsorships",
      href: "/dashboard/staff/sponsorships",
      icon: BadgeDollarSign,
    },
    {
      label: "Automations",
      href: "/dashboard/staff/automations",
      icon: Workflow,
    },
    {
      label: "Embeddings",
      href: "/dashboard/staff/embeddings",
      icon: DatabaseZap,
    },
    {
      label: "Opportunities",
      href: "/dashboard/staff/opportunities",
      icon: BriefcaseBusiness,
    },
    { label: "Analytics", href: "/dashboard/staff/analytics", icon: BarChart3 },
    { label: "Settings", href: "/dashboard/staff/settings", icon: Settings },
  ],
  admin: [
    {
      label: "Overview",
      href: "/dashboard/admin",
      icon: LayoutDashboard,
      active: true,
      group: "Overview",
    },
    {
      label: "Notifications",
      href: "/dashboard/notifications",
      icon: BellRing,
      group: "Overview",
    },
    {
      label: "Launch",
      href: "/dashboard/admin/launch",
      icon: Rocket,
      group: "Launch",
    },
    {
      label: "Users",
      href: "/dashboard/admin/users",
      icon: Users,
      group: "People",
    },
    {
      label: "Students",
      href: "/dashboard/admin/students",
      icon: GraduationCap,
      group: "People",
    },
    {
      label: "Partners",
      href: "/dashboard/admin/partners",
      icon: Building2,
      group: "People",
    },
    {
      label: "Opportunities",
      href: "/dashboard/admin/opportunities",
      icon: BriefcaseBusiness,
      group: "Opportunities",
    },
    {
      label: "Applications",
      href: "/dashboard/admin/applications",
      icon: ClipboardCheck,
      group: "Opportunities",
    },
    {
      label: "Verification",
      href: "/dashboard/admin/opportunities/verification",
      icon: ShieldCheck,
      group: "Opportunities",
    },
    {
      label: "Placement Requests",
      href: "/dashboard/admin/placement-requests",
      icon: Handshake,
      group: "Opportunities",
    },
    {
      label: "Service Hours",
      href: "/dashboard/admin/service-hours",
      icon: Medal,
      group: "Operations",
    },
    {
      label: "Events",
      href: "/dashboard/admin/events",
      icon: CalendarDays,
      group: "Operations",
    },
    {
      label: "Sponsorships",
      href: "/dashboard/admin/sponsorships",
      icon: BadgeDollarSign,
      group: "Operations",
    },
    {
      label: "Analytics",
      href: "/dashboard/admin/analytics",
      icon: BarChart3,
      group: "Analytics",
    },
    {
      label: "Advanced Analytics",
      href: "/dashboard/admin/advanced-analytics",
      icon: BarChart3,
      group: "Analytics",
    },
    {
      label: "Impact",
      href: "/dashboard/admin/impact",
      icon: Target,
      group: "Analytics",
    },
    {
      label: "Recommendation Evaluation",
      href: "/dashboard/admin/recommendation-evaluation",
      icon: Target,
      group: "Analytics",
    },
    {
      label: "Feedback",
      href: "/dashboard/admin/feedback",
      icon: MessageSquareText,
      group: "Analytics",
    },
    {
      label: "Data Quality",
      href: "/dashboard/admin/data-quality",
      icon: DatabaseZap,
      group: "System",
    },
    {
      label: "Audit Logs",
      href: "/dashboard/admin/audit-logs",
      icon: LockKeyhole,
      group: "System",
    },
    {
      label: "Data Imports",
      href: "/dashboard/admin/data-imports",
      icon: FileUp,
      group: "System",
    },
    {
      label: "Moderation",
      href: "/dashboard/admin/moderation",
      icon: ShieldCheck,
      group: "System",
    },
    {
      label: "Settings",
      href: "/dashboard/admin/settings",
      icon: Settings,
      group: "System",
    },
  ],
};

export const sharedComingSoon: ComingSoonItem[] = [
  {
    title: "Live analytics",
    description:
      "Platform metrics and activity summaries will appear here as data grows.",
    icon: BarChart3,
  },
  {
    title: "Workflow tools",
    description:
      "Application management, review tools, and approval workflows are in development.",
    icon: Sparkles,
  },
  {
    title: "Notifications",
    description:
      "Personalized alerts for new opportunities, application updates, and team activity.",
    icon: BellRing,
  },
];
