import { useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";

export type ArticleState = {
  is_read: boolean;
  is_saved: boolean;
  last_slide_index: number | null;
};

type SupabaseRow = {
  user_id: string;
  article_id: string;
  is_read: boolean;
  is_saved: boolean;
  last_slide_index: number | null;
};

const STORAGE_PREFIX = "ridehub:article_state:";
const LOCAL_SAVED_IDS_KEY = "ridehub:saved_article_ids";

/** ---- tiny in-memory pubsub so Home updates immediately ---- */
const listeners = new Set<() => void>();
function notify() {
  for (const fn of listeners) fn();
}
export function subscribeArticleState(fn: () => void) {
  listeners.add(fn);
    return () => {
    listeners.delete(fn);
  };

}

/** ---- local saved ids index ---- */
async function getLocalSavedIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_SAVED_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x === "string");
  } catch {
    return [];
  }
}

async function setLocalSavedIds(ids: string[]) {
  try {
    await AsyncStorage.setItem(LOCAL_SAVED_IDS_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

async function updateLocalSavedIds(articleId: string, is_saved: boolean) {
  const ids = await getLocalSavedIds();
  const exists = ids.includes(articleId);

  let next = ids;
  if (is_saved && !exists) next = [articleId, ...ids];
  if (!is_saved && exists) next = ids.filter((x) => x !== articleId);

  await setLocalSavedIds(next);
}

/**
 * AUTO: Supabase if signed-in, else local
 */
export function useAutoArticleState(articleId: string | null) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [state, setState] = useState<ArticleState>({
    is_read: false,
    is_saved: false,
    last_slide_index: null,
  });

  const storageKey = useMemo(() => {
    return articleId ? `${STORAGE_PREFIX}${articleId}` : null;
  }, [articleId]);

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setUserId(data.user?.id ?? null);
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!articleId) return;

    let alive = true;

    (async () => {
      setLoading(true);

      if (userId) {
        const { data, error } = await supabase
          .from("user_article_state")
          .select("user_id,article_id,is_read,is_saved,last_slide_index")
          .eq("user_id", userId)
          .eq("article_id", articleId)
          .maybeSingle();

        if (!alive) return;

        if (error || !data) {
          setState({ is_read: false, is_saved: false, last_slide_index: null });
        } else {
          const row = data as SupabaseRow;
          setState({
            is_read: !!row.is_read,
            is_saved: !!row.is_saved,
            last_slide_index: row.last_slide_index ?? null,
          });
        }

        setLoading(false);
        return;
      }

      try {
        const raw = storageKey ? await AsyncStorage.getItem(storageKey) : null;
        if (!alive) return;

        if (raw) {
          const parsed = JSON.parse(raw) as Partial<ArticleState>;
          setState({
            is_read: !!parsed.is_read,
            is_saved: !!parsed.is_saved,
            last_slide_index: parsed.last_slide_index ?? null,
          });
        } else {
          setState({ is_read: false, is_saved: false, last_slide_index: null });
        }
      } catch {
        if (!alive) return;
        setState({ is_read: false, is_saved: false, last_slide_index: null });
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [articleId, userId, storageKey]);

  async function saveLocal(next: ArticleState) {
    setState(next);
    if (!storageKey || !articleId) return;

    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // ignore
    }

    await updateLocalSavedIds(articleId, next.is_saved);
    notify();
  }

  async function saveSupabase(next: ArticleState) {
    if (!articleId || !userId) return;

    setState(next);

    await supabase
      .from("user_article_state")
      .upsert(
        {
          user_id: userId,
          article_id: articleId,
          is_read: next.is_read,
          is_saved: next.is_saved,
          last_slide_index: next.last_slide_index,
        },
        { onConflict: "user_id,article_id" }
      );

    notify();
  }

  async function setSaved(is_saved: boolean) {
    if (!articleId) return;
    setLoading(true);
    try {
      const next: ArticleState = { ...state, is_saved };
      if (userId) await saveSupabase(next);
      else await saveLocal(next);
    } finally {
      setLoading(false);
    }
  }

  async function setRead(is_read: boolean) {
    if (!articleId) return;
    setLoading(true);
    try {
      const next: ArticleState = { ...state, is_read };
      if (userId) await saveSupabase(next);
      else await saveLocal(next);
    } finally {
      setLoading(false);
    }
  }

  return {
    state,
    loading,
    isSignedIn: !!userId,
    setSaved,
    setRead,
  };
}

/**
 * SUPABASE ONLY (requires login)
 */
export function useSupabaseArticleState(articleId: string | null) {
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<ArticleState>({
    is_read: false,
    is_saved: false,
    last_slide_index: null,
  });

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setUserId(data.user?.id ?? null);
      setAuthLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!articleId) return;

    if (!userId) {
      setState({ is_read: false, is_saved: false, last_slide_index: null });
      return;
    }

    let alive = true;

    (async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("user_article_state")
        .select("user_id,article_id,is_read,is_saved,last_slide_index")
        .eq("user_id", userId)
        .eq("article_id", articleId)
        .maybeSingle();

      if (!alive) return;

      if (error || !data) {
        setState({ is_read: false, is_saved: false, last_slide_index: null });
      } else {
        const row = data as SupabaseRow;
        setState({
          is_read: !!row.is_read,
          is_saved: !!row.is_saved,
          last_slide_index: row.last_slide_index ?? null,
        });
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [userId, articleId]);

  async function upsert(next: ArticleState) {
    if (!userId || !articleId) return;

    setState(next);

    await supabase
      .from("user_article_state")
      .upsert(
        {
          user_id: userId,
          article_id: articleId,
          is_read: next.is_read,
          is_saved: next.is_saved,
          last_slide_index: next.last_slide_index,
        },
        { onConflict: "user_id,article_id" }
      );

    notify();
  }

  async function setSaved(is_saved: boolean) {
    if (!userId || !articleId) return;
    setLoading(true);
    try {
      await upsert({ ...state, is_saved });
    } finally {
      setLoading(false);
    }
  }

  async function setRead(is_read: boolean) {
    if (!userId || !articleId) return;
    setLoading(true);
    try {
      await upsert({ ...state, is_read });
    } finally {
      setLoading(false);
    }
  }

  return {
    userId,
    isSignedIn: !!userId,
    authLoading,
    state,
    loading,
    setSaved,
    setRead,
  };
}

/**
 * Home: get saved IDs (auto local vs supabase)
 */
export function useSavedArticleIds() {
  const [userId, setUserId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setUserId(data.user?.id ?? null);
    })();

    return () => {
      alive = false;
    };
  }, []);

  async function reload() {
    setLoading(true);

    if (userId) {
      const { data } = await supabase
        .from("user_article_state")
        .select("article_id")
        .eq("user_id", userId)
        .eq("is_saved", true);

      const ids =
        (data ?? [])
          .map((r: any) => r.article_id)
          .filter((x: any) => typeof x === "string") ?? [];

      setSavedIds(ids);
      setLoading(false);
      return;
    }

    const ids = await getLocalSavedIds();
    setSavedIds(ids);
    setLoading(false);
  }

  useEffect(() => {
    reload();
    const unsub = subscribeArticleState(() => reload());
    return unsub; // ✅ FIX: return the function, don't call it
  }, [userId]);

  return { savedIds, loading, isSignedIn: !!userId, reload };
}
