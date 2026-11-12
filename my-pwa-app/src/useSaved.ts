import { useState } from "react";

export function useSaved<T>(
  key: string,
  fallback: T,
  valid: (value: unknown) => boolean,
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
      return valid(parsed) ? (parsed as T) : fallback;
    } catch {
      return fallback;
    }
  });
  const [error, setError] = useState("");
  function save(next: T) {
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setValue(next);
      setError("");
      return true;
    } catch {
      setError("저장 공간을 사용할 수 없어 변경 내용을 저장하지 못했어요.");
      return false;
    }
  }
  return [value, save, error] as const;
}
