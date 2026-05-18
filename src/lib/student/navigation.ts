import { roleNavigation } from "@/components/dashboard/role-config";

function isItemActive(pathname: string, href: string): boolean {
  if (!href || href === "#") return false;
  if (pathname === href) return true;
  return href.split("/").length >= 4 && pathname.startsWith(href + "/");
}

export function getStudentNavItems(activeHref: string) {
  return roleNavigation.student.map((item) => ({
    ...item,
    active: isItemActive(activeHref, item.href),
  }));
}
