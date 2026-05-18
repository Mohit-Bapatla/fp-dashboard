import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BellRing,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  FileClock,
  GraduationCap,
  Handshake,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  MailCheck,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export type DashboardRole = "student" | "partner" | "staff" | "admin";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
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
    accent: "teal",
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
    { label: "Profile", href: "#", icon: GraduationCap },
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
    { label: "Placement Requests", href: "#", icon: FileClock },
    { label: "Saved", href: "#", icon: Bookmark },
    { label: "Settings", href: "#", icon: Settings },
  ],
  partner: [
    {
      label: "Overview",
      href: "/dashboard/partner",
      icon: LayoutDashboard,
      active: true,
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
    { label: "Organization", href: "#", icon: Building2 },
    { label: "Analytics", href: "#", icon: BarChart3 },
    { label: "Settings", href: "#", icon: Settings },
  ],
  staff: [
    {
      label: "Overview",
      href: "/dashboard/staff",
      icon: LayoutDashboard,
      active: true,
    },
    { label: "Partners", href: "#", icon: Building2 },
    { label: "Contacts", href: "#", icon: Users },
    { label: "Outreach", href: "#", icon: MailCheck },
    { label: "Tasks", href: "#", icon: ListChecks },
    { label: "Placement Requests", href: "#", icon: FileClock },
    { label: "Opportunities", href: "#", icon: BriefcaseBusiness },
    { label: "Analytics", href: "#", icon: BarChart3 },
    { label: "Settings", href: "#", icon: Settings },
  ],
  admin: [
    {
      label: "Overview",
      href: "/dashboard/admin",
      icon: LayoutDashboard,
      active: true,
    },
    { label: "Users", href: "#", icon: Users },
    {
      label: "Students",
      href: "/dashboard/admin/students",
      icon: GraduationCap,
    },
    { label: "Partners", href: "/dashboard/admin/partners", icon: Building2 },
    {
      label: "Opportunities",
      href: "/dashboard/admin/opportunities",
      icon: BriefcaseBusiness,
    },
    {
      label: "Applications",
      href: "/dashboard/admin/applications",
      icon: ClipboardCheck,
    },
    { label: "Placement Requests", href: "#", icon: Handshake },
    { label: "Audit Logs", href: "#", icon: LockKeyhole },
    { label: "Settings", href: "#", icon: Settings },
  ],
};

export const sharedComingSoon: ComingSoonItem[] = [
  {
    title: "Live data",
    description:
      "Connect dashboard metrics once the database layer is introduced.",
    icon: BarChart3,
  },
  {
    title: "Workflow actions",
    description: "Add create, review, and approval flows in later stages.",
    icon: Sparkles,
  },
  {
    title: "Notifications",
    description:
      "Surface role-specific alerts after messaging rules are defined.",
    icon: BellRing,
  },
];
