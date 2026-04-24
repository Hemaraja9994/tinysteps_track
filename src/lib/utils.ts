import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as formatDate } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type DateLike = string | number | Date | { toDate?: () => Date } | null | undefined

function toValidDate(value: DateLike): Date | null {
  if (value == null) return null
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value
  if (typeof value === "object" && typeof value.toDate === "function") {
    try {
      const d = value.toDate()
      return d instanceof Date && !isNaN(d.getTime()) ? d : null
    } catch {
      return null
    }
  }
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

export function safeFormat(value: DateLike, pattern: string, fallback = "—"): string {
  const d = toValidDate(value)
  if (!d) return fallback
  try {
    return formatDate(d, pattern)
  } catch {
    return fallback
  }
}
