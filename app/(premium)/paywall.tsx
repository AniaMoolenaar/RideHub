import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Check } from "lucide-react-native";

import Hero from "../../src/components/Hero";
import { supabase } from "../../src/lib/supabase";
import { useAppTheme, themeTokens } from "../../src/theme/theme";
import { L1 } from "../../src/styles/level1";
import { L2 } from "../../src/styles/level2";

const CURRENCY_PREFIX = "A$";
const SINGLE_PACK_PRICE = 15;
const FULL_PREMIUM_PRICE = 40;

type IndividualPackKey = "ride" | "maintain" | "learn";

type Ownership = {
  is_premium: boolean;
  has_ride: boolean;
  has_maintain: boolean;
  has_learn: boolean;
};

const EMPTY_OWNERSHIP: Ownership = {
  is_premium: false,
  has_ride: false,
  has_maintain: false,
  has_learn: false,
};

export default function PremiumPaywallScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();

  const t = themeTokens(isDark);

  const selectedBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
  const unselectedRing = isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.18)";
  const selectedRing = isDark ? "rgba(255,255,255,0.48)" : "rgba(0,0,0,0.24)";
  const selectedTickBg = isDark ? "rgba(255,255,255,0.82)" : "rgba(0,0,0,0.74)";
  const selectedTick = isDark ? "#111111" : "#ffffff";

  const [loadingOwnership, setLoadingOwnership] = useState(true);
  const [ownership, setOwnership] = useState<Ownership>(EMPTY_OWNERSHIP);

  const [selectedIndividualPacks, setSelectedIndividualPacks] = useState<IndividualPackKey[]>([]);
  const [fullPremiumSelected, setFullPremiumSelected] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadOwnership() {
      setLoadingOwnership(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) return;

        if (!user) {
          setOwnership(EMPTY_OWNERSHIP);
          setSelectedIndividualPacks([]);
          setFullPremiumSelected(true);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("is_premium,has_ride,has_maintain,has_learn")
          .eq("id", user.id)
          .single();

        if (!active) return;

        if (error || !data) {
          setOwnership(EMPTY_OWNERSHIP);
          setSelectedIndividualPacks([]);
          setFullPremiumSelected(true);
          return;
        }

        const nextOwnership: Ownership = {
          is_premium: !!data.is_premium,
          has_ride: !!data.has_ride,
          has_maintain: !!data.has_maintain,
          has_learn: !!data.has_learn,
        };

        setOwnership(nextOwnership);
        setSelectedIndividualPacks([]);
        setFullPremiumSelected(true);
      } finally {
        if (active) setLoadingOwnership(false);
      }
    }

    loadOwnership();

    return () => {
      active = false;
    };
  }, []);

  const ownedCount = useMemo(() => {
    let count = 0;
    if (ownership.has_ride) count += 1;
    if (ownership.has_maintain) count += 1;
    if (ownership.has_learn) count += 1;
    return count;
  }, [ownership]);

  const effectivelyPremium = ownership.is_premium || ownedCount === 3;

  function isOwned(pack: IndividualPackKey) {
    if (pack === "ride") return ownership.has_ride;
    if (pack === "maintain") return ownership.has_maintain;
    return ownership.has_learn;
  }

  function toggleIndividualPack(pack: IndividualPackKey) {
    if (isOwned(pack) || effectivelyPremium) return;

    setFullPremiumSelected(false);

    setSelectedIndividualPacks((current) => {
      if (current.includes(pack)) {
        return current.filter((p) => p !== pack);
      }
      return [...current, pack];
    });
  }

  function selectFullPremium() {
    if (effectivelyPremium) return;
    setFullPremiumSelected(true);
    setSelectedIndividualPacks([]);
  }

  const premiumUpgradePrice = useMemo(() => {
    const valueAlreadyOwned = ownedCount * SINGLE_PACK_PRICE;
    return Math.max(0, FULL_PREMIUM_PRICE - valueAlreadyOwned);
  }, [ownedCount]);

  const totalPrice = useMemo(() => {
    if (effectivelyPremium) return 0;
    if (fullPremiumSelected) return premiumUpgradePrice;
    return selectedIndividualPacks.length * SINGLE_PACK_PRICE;
  }, [effectivelyPremium, fullPremiumSelected, premiumUpgradePrice, selectedIndividualPacks]);

  const totalPriceLabel = useMemo(() => {
    return `${CURRENCY_PREFIX}${totalPrice.toFixed(2)}`;
  }, [totalPrice]);

  const selectedSummary = useMemo(() => {
    if (effectivelyPremium) return "Full Premium";

    if (fullPremiumSelected) {
      if (ownedCount === 0) return "Full Premium";
      return `Premium upgrade`;
    }

    if (selectedIndividualPacks.length === 0) return "No pack selected";

    if (selectedIndividualPacks.length === 1) {
      if (selectedIndividualPacks[0] === "ride") return "Ride Confidence Pack";
      if (selectedIndividualPacks[0] === "maintain") return "Bike Care & Maintenance Pack";
      return "Advanced Learning Pack";
    }

    return `${selectedIndividualPacks.length} packs selected`;
  }, [effectivelyPremium, fullPremiumSelected, ownedCount, selectedIndividualPacks]);

  const ctaLabel = useMemo(() => {
    if (effectivelyPremium) return "You already own Premium";
    if (fullPremiumSelected) {
      if (ownedCount === 0) return "Continue to payment";
      return `Upgrade to Premium • ${totalPriceLabel}`;
    }
    return "Continue to payment";
  }, [effectivelyPremium, fullPremiumSelected, ownedCount, totalPriceLabel]);

  const canContinue = useMemo(() => {
    if (loadingOwnership) return false;
    if (effectivelyPremium) return false;
    if (fullPremiumSelected) return true;
    return selectedIndividualPacks.length > 0;
  }, [loadingOwnership, effectivelyPremium, fullPremiumSelected, selectedIndividualPacks]);

  function getPackSubtitle(baseSubtitle: string, pack: IndividualPackKey) {
    if (effectivelyPremium || isOwned(pack)) return "Owned";
    return baseSubtitle;
  }

  function getPackPriceLabel(pack: IndividualPackKey) {
    if (effectivelyPremium || isOwned(pack)) return "Owned";
    return `${CURRENCY_PREFIX}${SINGLE_PACK_PRICE.toFixed(2)}`;
  }

  function PackCard({
    title,
    subtitle,
    price,
    selected,
    owned = false,
    onPress,
    compareAt,
  }: {
    title: string;
    subtitle: string;
    price: string;
    selected: boolean;
    owned?: boolean;
    onPress: () => void;
    compareAt?: string;
  }) {
    const showSelected = selected || owned;

    return (
      <Pressable
        onPress={onPress}
        disabled={owned}
        style={({ pressed }) => [
          styles.packCard,
          {
            backgroundColor: showSelected ? selectedBg : t.pillBg,
            opacity: owned ? 0.72 : pressed ? 0.94 : 1,
          },
        ]}
      >
        <View style={styles.packTopRow}>
          <View style={styles.packTextCol}>
            <Text style={[styles.packTitle, { color: t.text }]}>{title}</Text>
            <Text style={[styles.packSubtitle, { color: t.textMuted }]}>{subtitle}</Text>
          </View>

          <View
            style={[
              styles.radio,
              {
                borderColor: showSelected ? selectedRing : unselectedRing,
                backgroundColor: showSelected ? selectedTickBg : "transparent",
              },
            ]}
          >
            {showSelected ? <Check size={14} color={selectedTick} strokeWidth={2.4} /> : null}
          </View>
        </View>

        <View style={styles.priceRow}>
          {!!compareAt ? (
            <Text style={[styles.compareAt, { color: t.textMuted }]}>{compareAt}</Text>
          ) : (
            <View />
          )}

          <Text style={[styles.packPrice, { color: t.text }]}>{price}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[L1.screen, { backgroundColor: t.screenBg }]}>
      <ScrollView
        style={{ backgroundColor: t.screenBg }}
        contentContainerStyle={[
          L1.scrollContent24,
          { backgroundColor: t.screenBg, paddingBottom: 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Hero screen="premium" />

        <View style={styles.contentWrap}>
          <View style={styles.introWrap}>
            <Text style={[styles.title, { color: t.text }]}>Choose your premium access</Text>

            <Text style={[styles.subtitle, { color: t.textMuted }]}>
              Select any individual packs you want, or unlock everything with Full Premium.
            </Text>
          </View>

          {loadingOwnership ? (
            <View style={[styles.loadingWrap, { backgroundColor: t.pillBg }]}>
              <ActivityIndicator color={t.textMuted} />
            </View>
          ) : (
            <>
              <PackCard
                title="Ride Confidence Pack"
                subtitle={getPackSubtitle("Premium ride and safety content", "ride")}
                price={getPackPriceLabel("ride")}
                owned={isOwned("ride") || effectivelyPremium}
                selected={!fullPremiumSelected && selectedIndividualPacks.includes("ride")}
                onPress={() => toggleIndividualPack("ride")}
              />

              <PackCard
                title="Bike Care & Maintenance Pack"
                subtitle={getPackSubtitle("Premium maintenance knowledge and guidance", "maintain")}
                price={getPackPriceLabel("maintain")}
                owned={isOwned("maintain") || effectivelyPremium}
                selected={!fullPremiumSelected && selectedIndividualPacks.includes("maintain")}
                onPress={() => toggleIndividualPack("maintain")}
              />

              <PackCard
                title="Advanced Learning Pack"
                subtitle={getPackSubtitle("Deeper mechanical and technical learning", "learn")}
                price={getPackPriceLabel("learn")}
                owned={isOwned("learn") || effectivelyPremium}
                selected={!fullPremiumSelected && selectedIndividualPacks.includes("learn")}
                onPress={() => toggleIndividualPack("learn")}
              />

              <PackCard
                title="Full Premium"
                subtitle={
                  effectivelyPremium
                    ? "Owned"
                    : ownedCount > 0
                    ? `Upgrade from ${ownedCount} owned pack${ownedCount === 1 ? "" : "s"}`
                    : "All packs and premium tools"
                }
                price={
                  effectivelyPremium
                    ? "Owned"
                    : `${CURRENCY_PREFIX}${premiumUpgradePrice.toFixed(2)}`
                }
                compareAt={effectivelyPremium ? undefined : `${CURRENCY_PREFIX}45.00`}
                owned={effectivelyPremium}
                selected={fullPremiumSelected}
                onPress={selectFullPremium}
              />
            </>
          )}

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: t.pillBg,
              },
            ]}
          >
            <Text style={[styles.summaryLabel, { color: t.textMuted }]}>Selected</Text>

            <Text style={[styles.summaryTitle, { color: t.text }]}>{selectedSummary}</Text>

            <Text style={[styles.summaryPrice, { color: t.text }]}>
              {effectivelyPremium ? "Owned" : totalPriceLabel}
            </Text>

            <Pressable
              onPress={() => {}}
              disabled={!canContinue}
              style={({ pressed }) => [
                L2.ctaOuter,
                {
                  opacity: !canContinue ? 0.45 : pressed ? 0.92 : 1,
                  marginTop: 16,
                },
              ]}
            >
              <LinearGradient
                colors={["#926806", "#ffe093", "#c99b32", "#8a6000"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={L2.absoluteFill}
              />
              <View style={L2.ctaInner}>
                <Text style={[L2.ctaText, { color: "#111111" }]}>{ctaLabel}</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backBtn,
                {
                  backgroundColor: t.screenBg,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <Text style={[styles.backBtnText, { color: t.textMuted }]}>Back</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
  },

  introWrap: {
    marginTop: 22,
    marginBottom: 22,
    alignItems: "center",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 320,
  },

  loadingWrap: {
    borderRadius: 18,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  packCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  packTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  packTextCol: {
    flex: 1,
  },

  packTitle: {
    fontSize: 15,
    fontWeight: "800",
  },

  packSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
  },

  radio: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 1.25,
    alignItems: "center",
    justifyContent: "center",
  },

  priceRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  compareAt: {
    fontSize: 12,
    textDecorationLine: "line-through",
  },

  packPrice: {
    fontSize: 14,
    fontWeight: "800",
  },

  summaryCard: {
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginTop: 4,
  },

  summaryLabel: {
    fontSize: 12,
  },

  summaryTitle: {
    marginTop: 6,
    fontSize: 17,
    fontWeight: "800",
  },

  summaryPrice: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "800",
  },

  backBtn: {
    marginTop: 10,
    minHeight: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  backBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
});