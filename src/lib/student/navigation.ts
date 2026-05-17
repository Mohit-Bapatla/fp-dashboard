import { roleNavigation } from "@/components/dashboard/role-config";

export function getStudentNavItems(activeHref: string) {
  return roleNavigation.student.map((item) => ({
    ...item,
    active: item.href === activeHref,
  }));
}
