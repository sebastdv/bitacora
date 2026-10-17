import { useEffect, useState } from "react";

/** State remembered in this browser only (localStorage may be unavailable: then it is just state). */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? initial : (JSON.parse(stored) as T);
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Private mode or full storage: keep working without persistence.
    }
  }, [key, value]);
  return [value, setValue] as const;
}

