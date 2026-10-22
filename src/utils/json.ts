/**
 * Safe JSON utilities to avoid circular reference and serialization crashes.
 */

export function safeJsonStringify(obj: any, space?: string | number): string {
  try {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular]";
        }
        seen.add(value);
      }
      return value;
    }, space);
  } catch (err) {
    console.error("Error in safeJsonStringify:", err);
    return "{}";
  }
}

export function safeJsonParse<T>(str: string | null, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch (err) {
    console.error("Error in safeJsonParse:", err);
    return fallback;
  }
}
