export function parsePagination(
  page?: string,
  pageSize?: string,
  defaults: { page?: number; pageSize?: number; maxPageSize?: number } = {},
) {
  const maxPageSize = defaults.maxPageSize ?? 100;
  const defaultPage = defaults.page ?? 1;
  const defaultPageSize = defaults.pageSize ?? 25;
  let p = page ? Number(page) : defaultPage;
  let ps = pageSize ? Number(pageSize) : defaultPageSize;
  if (!Number.isFinite(p) || p < 1) p = defaultPage;
  if (!Number.isFinite(ps) || ps < 1) ps = defaultPageSize;
  if (ps > maxPageSize) ps = maxPageSize;
  return { page: Math.floor(p), pageSize: Math.floor(ps) };
}
