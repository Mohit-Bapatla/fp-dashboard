import { roleNavigation } from "@/components/dashboard/role-config";

export function getAdminNavItems(activeHref: string) {
  return roleNavigation.admin.map((item) => ({
    ...item,
    active: item.href === activeHref,
  }));
}
