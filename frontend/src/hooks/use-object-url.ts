import { useEffect, useState } from "react";

interface ObjectUrlState {
  source: Blob;
  url: string;
}

export function useObjectUrl(source: Blob | undefined): string | undefined {
  const [current, setCurrent] = useState<ObjectUrlState>();

  useEffect(() => {
    if (!source) {
      const timer = window.setTimeout(() => setCurrent(undefined), 0);
      return () => window.clearTimeout(timer);
    }
    const url = URL.createObjectURL(source);
    const timer = window.setTimeout(() => setCurrent({ source, url }), 0);
    return () => {
      window.clearTimeout(timer);
      URL.revokeObjectURL(url);
    };
  }, [source]);

  return current && source && current.source === source
    ? current.url
    : undefined;
}
