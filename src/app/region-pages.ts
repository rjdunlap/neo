/** Keep game landmarks large and separate; additional activities get another page. */
export const REGION_PAGE_SIZE = 2;
export function regionPage(total: number, requested: number) {
  const pages = Math.max(1, Math.ceil(total / REGION_PAGE_SIZE));
  const page = Math.max(0, Math.min(pages - 1, requested));
  return { page, pages, start: page * REGION_PAGE_SIZE, end: Math.min(total, (page + 1) * REGION_PAGE_SIZE) };
}
