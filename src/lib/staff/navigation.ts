import { roleNavigation } from "@/components/dashboard/role-config";

export function getStaffNavItems(activeHref: string) {
  return roleNavigation.staff.map((item) => ({
    ...item,
    active: item.href === activeHref,
  }));
}
