export const defaultPageSize = 20;

export function getPageParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value.at(0) : value;
  const page = Number.parseInt(raw ?? "1", 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function getPagination(page: number, pageSize = defaultPageSize) {
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function getTotalPages(totalCount: number, pageSize = defaultPageSize) {
  return Math.max(1, Math.ceil(totalCount / pageSize));
}

export function buildPageHref({
  page,
  pathname,
  searchParams,
}: {
  page: number;
  pathname: string;
  searchParams: Record<string, string>;
}) {
  const params = new URLSearchParams(searchParams);

  if (page <= 1) {
    params.delete("page");
  } else {
    params.set("page", page.toString());
  }

  const query = params.toString();

  return query ? `${pathname}?${query}` : pathname;
}
