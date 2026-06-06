// Normalize raw backend records to match frontend types

type Raw = Record<string, unknown>;

/** Combine firstName + lastName into name */
export function normalizeName(r: Raw): string {
  if (typeof r.name === "string" && r.name) return r.name;
  return [r.firstName, r.lastName].filter(Boolean).join(" ") || (r.email as string) || "—";
}

/** Map backend meta → frontend pagination shape */
export function normalizeMeta(meta?: Raw) {
  return {
    total: (meta?.total as number) ?? 0,
    pages: (meta?.totalPages as number) ?? 1,
  };
}

/** Normalize a student record from backend */
export function normalizeStudent(r: Raw): Raw {
  return {
    ...r,
    name: normalizeName(r),
    rollNumber: r.rollNumber ?? r.studentId ?? "",
  };
}

/** Normalize a teacher record from backend */
export function normalizeTeacher(r: Raw): Raw {
  return {
    ...r,
    name: normalizeName(r),
  };
}

/** Parse any paginated list response into { data, pagination } */
export function parsePaginated<T>(res: unknown, normalize?: (r: Raw) => Raw): { data: T[]; pagination: { total: number; pages: number } } {
  const raw = res as { data?: unknown; meta?: Raw } | unknown[];
  if (Array.isArray(raw)) {
    const rows = normalize ? raw.map((r) => normalize(r as Raw)) as T[] : raw as T[];
    return { data: rows, pagination: { total: rows.length, pages: 1 } };
  }
  const obj = raw as { data?: unknown[]; meta?: Raw };
  const rows = (obj.data ?? []) as Raw[];
  return {
    data: (normalize ? rows.map(normalize) : rows) as T[],
    pagination: normalizeMeta(obj.meta),
  };
}
