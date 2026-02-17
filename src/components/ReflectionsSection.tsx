import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { supabase } from "../lib/supabase";
import { useAppTheme, themeTokens } from "../theme/theme";
import { getDesign } from "../theme/design";

type ReflectionRow = {
  id: string;
  user_id: string;
  text: string;
  is_resolved: boolean;
  created_at: string;
};

type RelatedArticleRow = {
  article_id: string;
  slug: string;
  title: string;
  tab: string;
  category: string | null;
  score: number;
};

export default function ReflectionsSection() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);
  const d = getDesign(isDark); // keep (used elsewhere)

  const pillBg = t.pillBg;
  const pillBorder = t.pillBorder;

  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ReflectionRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => (selectedId ? items.find((x) => x.id === selectedId) ?? null : null),
    [items, selectedId]
  );

  const [relatedOpen, setRelatedOpen] = useState(false);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [related, setRelated] = useState<RelatedArticleRow[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;

      const uid = data?.user?.id ?? null;
      setUserId(uid);
      setAuthChecked(true);

      if (uid) {
        await load(uid);
      } else {
        setItems([]);
        setSelectedId(null);
        setRelated([]);
        setRelatedOpen(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  async function load(uid: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reflections")
        .select("id,user_id,text,is_resolved,created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(14);

      if (error) {
        console.log("REFLECTIONS LOAD ERROR:", error);
        setItems([]);
        setSelectedId(null);
        setRelated([]);
        setRelatedOpen(false);
        return;
      }

      const rows = (data ?? []) as ReflectionRow[];
      setItems(rows);

      const nextSelected =
        (selectedId && rows.find((r) => r.id === selectedId)?.id) ??
        rows[0]?.id ??
        null;

      setSelectedId(nextSelected);
      setRelated([]);
      setRelatedOpen(false);
    } finally {
      setLoading(false);
    }
  }

  async function loadRelated(issueText: string) {
    setRelatedLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_related_articles", {
        issue_text: issueText,
        limit_n: 3,
      });

      if (error) {
        console.log("REFLECTIONS RELATED RPC ERROR:", error);
        setRelated([]);
        return;
      }

      setRelated((data ?? []) as RelatedArticleRow[]);
    } finally {
      setRelatedLoading(false);
    }
  }

  async function onSelect(id: string) {
    setSelectedId(id);
    setRelatedOpen(false);
    setRelated([]);
  }

  async function onToggleResolved(row: ReflectionRow) {
    if (!userId) return;

    setItems((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, is_resolved: !r.is_resolved } : r))
    );

    const { error } = await supabase
      .from("reflections")
      .update({ is_resolved: !row.is_resolved })
      .eq("id", row.id)
      .eq("user_id", userId);

    if (error) {
      console.log("REFLECTIONS TOGGLE ERROR:", error);
      setItems((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, is_resolved: row.is_resolved } : r))
      );
    }
  }

  function confirmDelete(row: ReflectionRow) {
    if (!userId) return;

    Alert.alert("Delete reflection?", "This can’t be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("reflections")
            .delete()
            .eq("id", row.id)
            .eq("user_id", userId);

          if (error) {
            console.log("REFLECTIONS DELETE ERROR:", error);
            return;
          }

          await load(userId);
        },
      },
    ]);
  }

  async function onSave() {
    const v = text.trim();
    if (!v || !userId || saving) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("reflections").insert({
        user_id: userId,
        text: v,
        is_resolved: false,
      });

      if (error) {
        console.log("REFLECTIONS INSERT ERROR:", error);
        return;
      }

      setModalOpen(false);
      setText("");
      await load(userId);
    } finally {
      setSaving(false);
    }
  }

  function openRelated(r: RelatedArticleRow) {
    const tab = (r.tab ?? "").toLowerCase();

    if (tab === "ride") {
      router.push({
        pathname: "/ride-article/[articleId]",
        params: { articleId: r.article_id },
      });
      return;
    }
    if (tab === "maintain") {
      router.push("/maintain-gateway");
      return;
    }
    if (tab === "learn") {
      router.push("/learn-gateway");
      return;
    }
    router.push("/premium");
  }

  return (
    <View style={{ marginTop: 22 }}>
      {/* HEADER (do not touch) */}
      <Header title="Reflections" textColor={t.text} />

      {/* Body */}
      <View style={{ paddingHorizontal: 16 }}>
        {/* Top row: helper + Add */}
        <View style={ui.topRow}>
          <Text style={[ui.helper, { color: t.textMuted }]}>
            Capture a thought, then pull relevant topics when you want direction.
          </Text>

          <Pressable
            onPress={() => userId && setModalOpen(true)}
            disabled={!userId}
            style={({ pressed }) => [
              ui.addBtn,
              {
                borderColor: pillBorder,
                backgroundColor: pillBg,
                opacity: !userId ? 0.35 : pressed ? 0.82 : 1,
              },
            ]}
          >
            <Text style={[ui.addBtnText, { color: t.textMuted }]}>Add</Text>
          </Pressable>
        </View>

        {/* Card container */}
        <View
          style={[
            ui.shell,
            {
              borderColor: pillBorder,
              backgroundColor: pillBg,
            },
          ]}
        >
          {!authChecked ? (
            <View style={ui.centerPad}>
              <ActivityIndicator size="small" color={t.textMuted} />
            </View>
          ) : !userId ? (
            <View style={ui.centerPad}>
              <Text style={[ui.muted, { color: t.textMuted }]}>Log in to save reflections.</Text>
            </View>
          ) : loading ? (
            <View style={ui.centerPad}>
              <ActivityIndicator size="small" color={t.textMuted} />
            </View>
          ) : items.length === 0 ? (
            <View style={ui.empty}>
              <Text style={[ui.emptyTitle, { color: t.text }]}>No reflections yet</Text>
              <Text style={[ui.muted, { color: t.textMuted }]}>
                Keep them short. You can return later and pull related topics when you need help.
              </Text>

              <Pressable
                onPress={() => setModalOpen(true)}
                style={({ pressed }) => [
                  ui.primaryCta,
                  { backgroundColor: t.text, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={[ui.primaryCtaText, { color: t.screenBg }]}>Add your first</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Pills row */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 10, gap: 10 }}
              >
                {items.map((r) => {
                  const isSelected = r.id === selectedId;
                  const isResolved = !!r.is_resolved;

                  return (
                    <Pressable
                      key={r.id}
                      onPress={() => onSelect(r.id)}
                      onLongPress={() => confirmDelete(r)}
                      delayLongPress={350}
                      style={({ pressed }) => [
                        ui.chip,
                        {
                          borderColor: isSelected ? t.text : pillBorder,
                          backgroundColor: t.screenBg,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      <View style={ui.chipRow}>
                        <Pressable
                          onPress={() => onToggleResolved(r)}
                          hitSlop={10}
                          style={({ pressed }) => [
                            ui.check,
                            {
                              borderColor: isResolved ? t.text : pillBorder,
                              backgroundColor: isResolved ? t.text : "transparent",
                              opacity: pressed ? 0.8 : 1,
                            },
                          ]}
                        />

                        <Text
                          numberOfLines={1}
                          style={[
                            ui.chipText,
                            {
                              color: isResolved ? t.textMuted : t.text,
                            },
                          ]}
                        >
                          {r.text}
                        </Text>
                      </View>

                      <View style={ui.chipMetaRow}>
                        <View
                          style={[
                            ui.stateDot,
                            {
                              backgroundColor: isResolved ? t.textMuted : t.text,
                              opacity: isResolved ? 0.55 : 0.95,
                            },
                          ]}
                        />
                        <Text style={[ui.chipMeta, { color: t.textMuted }]}>
                          {isResolved ? "Resolved" : "Open"}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Selected detail card */}
              {selected ? (
                <View
                  style={[
                    ui.detail,
                    {
                      borderColor: pillBorder,
                      backgroundColor: t.screenBg,
                    },
                  ]}
                >
                  <View style={ui.detailTop}>
                    <Text style={[ui.detailLabel, { color: t.textMuted }]}>
                      {selected.is_resolved ? "Resolved" : "Open"}
                    </Text>

                    <Pressable
                      onPress={() => confirmDelete(selected)}
                      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
                    >
                      <Text style={[ui.detailAction, { color: t.textMuted }]}>Delete</Text>
                    </Pressable>
                  </View>

                  <Text style={[ui.detailText, { color: t.text }]}>{selected.text}</Text>

                  <View style={ui.detailButtons}>
                    <Pressable
                      onPress={() => onToggleResolved(selected)}
                      style={({ pressed }) => [
                        ui.secondaryBtn,
                        {
                          borderColor: pillBorder,
                          backgroundColor: pillBg,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      <Text style={[ui.secondaryBtnText, { color: t.textMuted }]}>
                        {selected.is_resolved ? "Mark open" : "Mark resolved"}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={async () => {
                        const next = !relatedOpen;
                        setRelatedOpen(next);
                        if (next && selected.text) {
                          await loadRelated(selected.text);
                        }
                      }}
                      style={({ pressed }) => [
                        ui.secondaryBtn,
                        {
                          borderColor: pillBorder,
                          backgroundColor: pillBg,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      <Text style={[ui.secondaryBtnText, { color: t.textMuted }]}>
                        Related topics {relatedOpen ? "▾" : "▸"}
                      </Text>
                    </Pressable>
                  </View>

                  {relatedOpen ? (
                    <View style={ui.relatedWrap}>
                      {relatedLoading ? (
                        <View style={{ paddingTop: 10 }}>
                          <ActivityIndicator size="small" color={t.textMuted} />
                        </View>
                      ) : related.length ? (
                        related.map((r) => (
                          <Pressable
                            key={r.article_id}
                            onPress={() => openRelated(r)}
                            style={({ pressed }) => [
                              ui.relatedRow,
                              {
                                borderTopColor: pillBorder,
                                opacity: pressed ? 0.78 : 1,
                              },
                            ]}
                          >
                            <View style={ui.relatedTextWrap}>
                              <Text style={[ui.relatedTitle, { color: t.text }]}>{r.title}</Text>
                              <Text style={[ui.relatedMeta, { color: t.textMuted }]}>
                                {(r.tab ?? "").toUpperCase()}
                                {r.category ? ` • ${r.category}` : ""}
                              </Text>
                            </View>
                            <Text style={[ui.relatedArrow, { color: t.textMuted }]}>›</Text>
                          </Pressable>
                        ))
                      ) : (
                        <Text style={[ui.muted, { color: t.textMuted, paddingTop: 10 }]}>
                          Nothing obvious yet.
                        </Text>
                      )}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </>
          )}
        </View>
      </View>

      {/* Add modal */}
      <Modal visible={modalOpen} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }}>
          <Pressable style={{ flex: 1 }} onPress={() => !saving && setModalOpen(false)} />

          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View
              style={{
                padding: 16,
                paddingBottom: 20,
                backgroundColor: t.screenBg,
                borderTopLeftRadius: 22,
                borderTopRightRadius: 22,
                borderWidth: 1,
                borderColor: pillBorder,
              }}
            >
              <Text style={{ color: t.text, fontSize: 15, fontWeight: "900" }}>
                Add reflection
              </Text>

              <Text style={{ color: t.textMuted, marginTop: 6, fontSize: 13, lineHeight: 18 }}>
                One line is enough.
              </Text>

              <View
                style={{
                  marginTop: 12,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: pillBorder,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  backgroundColor: pillBg,
                }}
              >
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="e.g. Tailgaters stress me out at night"
                  placeholderTextColor={t.textMuted}
                  multiline
                  style={{ color: t.text, minHeight: 74, fontSize: 14, lineHeight: 20 }}
                  editable={!saving}
                />
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <Pressable
                  onPress={() => !saving && setModalOpen(false)}
                  disabled={saving}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 16,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: pillBorder,
                    opacity: saving ? 0.5 : pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ color: t.text, fontWeight: "900" }}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={onSave}
                  disabled={saving || !text.trim()}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 16,
                    alignItems: "center",
                    backgroundColor: t.text,
                    opacity: saving || !text.trim() ? 0.45 : pressed ? 0.85 : 1,
                  })}
                >
                  {saving ? (
                    <ActivityIndicator color={t.screenBg} />
                  ) : (
                    <Text style={{ color: t.screenBg, fontWeight: "900" }}>Save</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

function Header({ title, textColor }: { title: string; textColor: string }) {
  return (
    <View style={styles.headerWrap}>
      <View style={styles.headerRow}>
        <LinearGradient
          colors={["transparent", "#ffe093", "#c99b32", "#926806"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.headerLine}
        />
        <Text style={[styles.headerText, { color: textColor }]}>{title}</Text>
        <LinearGradient
          colors={["#926806", "#c99b32", "#ffe093", "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.headerLine}
        />
      </View>
    </View>
  );
}

const ui = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  helper: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    paddingTop: 2,
  },
  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  addBtnText: { fontSize: 12, fontWeight: "900" },

  shell: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
  },
  centerPad: { paddingVertical: 14, alignItems: "flex-start" },

  empty: { paddingVertical: 6 },
  emptyTitle: { fontSize: 15, fontWeight: "900", marginBottom: 6 },
  muted: { fontSize: 13, lineHeight: 18 },

  primaryCta: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  primaryCtaText: { fontWeight: "900", fontSize: 13 },

  chip: {
    width: 240,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  chipRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  check: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "900",
    flex: 1,
  },
  chipMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  stateDot: { width: 7, height: 7, borderRadius: 99 },
  chipMeta: { fontSize: 12, fontWeight: "900" },

  detail: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  detailTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  detailLabel: { fontSize: 12, fontWeight: "900" },
  detailAction: { fontSize: 12, fontWeight: "900" },
  detailText: { marginTop: 10, fontSize: 15, lineHeight: 21, fontWeight: "800" },

  detailButtons: { flexDirection: "row", gap: 10, marginTop: 12 },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  secondaryBtnText: { fontSize: 12, fontWeight: "900" },

  relatedWrap: { marginTop: 4 },
  relatedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
  },
  relatedTextWrap: { flex: 1, paddingRight: 10 },
  relatedTitle: { fontSize: 14, fontWeight: "900" },
  relatedMeta: { fontSize: 12, marginTop: 3, fontWeight: "800" },
  relatedArrow: { fontSize: 20, fontWeight: "900" },
});

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 20, marginBottom: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 6 },
  headerLine: { height: 2, flex: 1 },
  headerText: { fontSize: 18, fontWeight: "600" },
});
