import { roleNavigation } from "@/components/dashboard/role-config";

export function getPartnerNavItems(activeHref: string) {
  return roleNavigation.partner.map((item) => ({
    ...item,
    active: item.href === activeHref,
  }));
}
