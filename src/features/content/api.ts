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
  tab: string | null;
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

export type ArticleRow = {
  title: string;
  subheading: string | null;
  summary: string | null;
  content_md: string;
  info_image_url: string | null;
  info_text: string | null;
  group_title: string | null;
  group_description: string | null;
};

export async function fetchSavedArticles(ids: string[]): Promise<SavedArticleRow[]> {
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from("articles")
    .select("id,title,tab,hero_image_url,groups(image_url)")
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

export async function fetchArticle(id: string): Promise<ArticleRow | null> {
  const { data, error } = await supabase
    .from("articles")
    .select(
      "title,subheading,summary,content_md,info_image_url,info_text,groups(title,description)"
    )
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (error) throw error;
  if (!data) return null;

  const row = data as any;

  const groupTitle = Array.isArray(row.groups)
    ? row.groups[0]?.title ?? null
    : row.groups?.title ?? null;

  const groupDescription = Array.isArray(row.groups)
    ? row.groups[0]?.description ?? null
    : row.groups?.description ?? null;

  return {
    title: row.title,
    subheading: row.subheading ?? null,
    summary: row.summary ?? null,
    content_md: row.content_md ?? "",
    info_image_url: row.info_image_url ?? null,
    info_text: row.info_text ?? null,
    group_title: groupTitle,
    group_description: groupDescription,
  };
}

export async function fetchGroup(id: string) {
  const { data, error } = await supabase
    .from("groups")
    .select("id,title,description,is_premium")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchGroupArticles(
  groupId: string,
  tab: "ride" | "learn" | "maintain"
) {
  const { data, error } = await supabase
    .from("articles")
    .select("id,title,subheading,summary")
    .eq("group_id", groupId)
    .eq("tab", tab)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  return user;
}

export async function fetchProfileEntitlements(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("is_premium, has_ride, has_maintain, has_learn")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchUserArticleState(userId: string, articleIds: string[]) {
  if (!articleIds.length) return [];

  const { data, error } = await supabase
    .from("user_article_state")
    .select("article_id,is_read,is_saved")
    .eq("user_id", userId)
    .in("article_id", articleIds);

  if (error) throw error;
  return data ?? [];
}