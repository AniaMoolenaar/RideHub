import { supabase } from "../../lib/supabase";

export type SearchHit = {
  id: string;
  title: string;
  tab: string | null;
  category: string | null;
};

export type SavedArticleRow = {
  id: string;
  title: string;
  hero_image_url: string | null;
  groups:
    | {
        image_url: string | null;
      }
    | {
        image_url: string | null;
      }[]
    | null;
};

export async function fetchSavedArticles(ids: string[]): Promise<SavedArticleRow[]> {
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from("articles")
    .select("id,title,hero_image_url,groups(image_url)")
    .in("id", ids);

  if (error) throw error;
  return (data ?? []) as SavedArticleRow[];
}

export async function searchArticles(query: string): Promise<SearchHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const { data, error } = await supabase
    .from("articles")
    .select("id,title,tab,category")
    .or(
      [
        `title.ilike.%${trimmed}%`,
        `slug.ilike.%${trimmed}%`,
        `category.ilike.%${trimmed}%`,
      ].join(",")
    )
    .limit(8);

  if (error) throw error;
  return (data ?? []) as SearchHit[];
}

export type GroupRow = {
  id: string;
  title: string;
  description: string | null;
  is_premium: boolean;
};

export type GroupArticleRow = {
  id: string;
  title: string;
  subheading: string | null;
  summary: string | null;
};

export type ProfileEntitlements = {
  is_premium: boolean;
  has_ride: boolean;
  has_maintain: boolean;
  has_learn: boolean;
};

export type ArticleStateRow = {
  article_id: string;
  is_read: boolean;
  is_saved: boolean;
};

export async function fetchGroup(groupId: string): Promise<GroupRow | null> {
  const { data, error } = await supabase
    .from("groups")
    .select("id,title,description,is_premium")
    .eq("id", groupId)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    description: data.description ?? null,
    is_premium: !!data.is_premium,
  };
}

export async function fetchGroupArticles(
  groupId: string,
  tab: "ride" | "learn" | "maintain"
): Promise<GroupArticleRow[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("id,title,subheading,summary")
    .eq("group_id", groupId)
    .eq("tab", tab)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((a: any) => ({
    id: a.id,
    title: a.title,
    subheading: a.subheading ?? null,
    summary: a.summary ?? null,
  }));
}

export async function fetchCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function fetchProfileEntitlements(
  userId: string
): Promise<ProfileEntitlements | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("is_premium, has_ride, has_maintain, has_learn")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data as ProfileEntitlements;
}

export async function fetchUserArticleState(
  userId: string,
  articleIds: string[]
): Promise<ArticleStateRow[]> {
  if (!articleIds.length) return [];

  const { data, error } = await supabase
    .from("user_article_state")
    .select("article_id,is_read,is_saved")
    .eq("user_id", userId)
    .in("article_id", articleIds);

  if (error) throw error;
  return (data ?? []) as ArticleStateRow[];
}

export async function fetchArticle(id: string) {
  const { data, error } = await supabase
    .from("articles")
    .select("title,summary,content_md,info_image_url,info_text")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (error) throw error;

  return data;
}