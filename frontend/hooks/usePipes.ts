"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Pipe } from "@/lib/supabase/types";

export function usePipes() {
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchPipes = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("pipes")
        .select("*")
        .order("zone_id")
        .order("pipe_id");

      if (fetchError) throw fetchError;
      setPipes(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch pipes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipes();
  }, [fetchPipes]);

  return { pipes, loading, error, refetch: fetchPipes };
}
