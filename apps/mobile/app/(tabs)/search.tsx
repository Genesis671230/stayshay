import { useEffect, useMemo, useState } from "react";
import { FlatList, Keyboard, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/lib/data";
import { C, F, R } from "@/lib/theme";
import { TYPE_LABEL_PLURAL, filterListings, searchAreas, type Area, type ListingFilters, type ListingType, type SortKey } from "@/lib/core";
import { Chip, Icon, ListingCard, T, Tap } from "@/components/ui";

const TYPES: ListingType[] = ["bed_space", "partition", "room", "studio"];
const BUDGETS = [1000, 1500, 2500, 4000];
const SORTS: [SortKey, string][] = [
  ["recommended", "Recommended"],
  ["price_asc", "Lowest price"],
  ["newest", "Newest"],
];

export default function Search() {
  const params = useLocalSearchParams<{ type?: string; area?: string; max?: string; metro?: string; bills?: string; nodeposit?: string }>();
  const { listings, areas, areaBySlug } = useData();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const [area, setArea] = useState<Area | null>(null);
  const [f, setF] = useState<ListingFilters>({});

  // Links like "See all" arrive as params; apply them whenever they change.
  useEffect(() => {
    const t = TYPES.find((x) => x === params.type);
    setF({
      types: t ? [t] : undefined,
      maxPrice: params.max ? Number(params.max) : undefined,
      nearMetro: params.metro === "1" || undefined,
      billsIncluded: params.bills === "1" || undefined,
      noDeposit: params.nodeposit === "1" || undefined,
    });
    const a = params.area ? areaBySlug.get(params.area) ?? null : null;
    setArea(a);
    setQ(a?.name ?? "");
  }, [params.type, params.area, params.max, params.metro, params.bills, params.nodeposit, areaBySlug]);

  const suggestions = useMemo(() => (focus && q.trim() && q !== area?.name ? searchAreas(areas, q, 6).map((m) => m.area) : []), [areas, q, focus, area]);
  const results = useMemo(() => filterListings(listings, areas, { ...f, areaSlugs: area ? [area.slug] : undefined }), [listings, areas, f, area]);
  const toggle = (k: keyof ListingFilters, v: unknown) => setF((cur) => ({ ...cur, [k]: cur[k] === v ? undefined : v }));

  const header = (
    <View>
      <View style={s.typeRow}>
        <Chip label="All" active={!f.types?.length} onPress={() => setF({ ...f, types: undefined })} />
        {TYPES.map((t) => (
          <Chip key={t} label={TYPE_LABEL_PLURAL[t]} active={f.types?.[0] === t} onPress={() => setF({ ...f, types: f.types?.[0] === t ? undefined : [t] })} />
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingBottom: 6 }}>
        {BUDGETS.map((b) => (
          <Chip key={b} tone="mint" label={`Under ${b.toLocaleString("en-US")}`} active={f.maxPrice === b} onPress={() => toggle("maxPrice", b)} />
        ))}
        <Chip tone="mint" label="Bills included" active={!!f.billsIncluded} onPress={() => toggle("billsIncluded", true)} />
        <Chip tone="mint" label="No deposit" active={!!f.noDeposit} onPress={() => toggle("noDeposit", true)} />
        <Chip tone="mint" label="Near metro" active={!!f.nearMetro} onPress={() => toggle("nearMetro", true)} />
        <Chip tone="mint" label="Female" active={f.gender === "female"} onPress={() => toggle("gender", "female")} />
        <Chip tone="mint" label="Male" active={f.gender === "male"} onPress={() => toggle("gender", "male")} />
      </ScrollView>
      <View style={s.countRow}>
        <T w="bold" size={15}>
          {results.length} {results.length === 1 ? "place" : "places"}
          {area ? <T size={15} color={C.muted}> in {area.name}</T> : null}
        </T>
        <View style={{ flexDirection: "row", gap: 4 }}>
          {SORTS.map(([k, label]) => (
            <Tap key={k} onPress={() => setF({ ...f, sort: k })} style={[s.sort, (f.sort ?? "recommended") === k && { backgroundColor: C.ivory }]}>
              <T w="semibold" size={12} color={(f.sort ?? "recommended") === k ? C.brand : C.muted}>
                {label}
              </T>
            </Tap>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.white, paddingTop: insets.top + 8 }}>
      <View style={{ paddingHorizontal: 20, paddingBottom: 10, zIndex: 10 }}>
        <View style={s.searchBox}>
          <Icon name="search" size={19} color={C.brand} />
          <TextInput
            value={q}
            onChangeText={(t) => {
              setQ(t);
              if (!t) setArea(null);
            }}
            onFocus={() => setFocus(true)}
            onBlur={() => setTimeout(() => setFocus(false), 150)}
            placeholder="Area, metro or community"
            placeholderTextColor={C.muted}
            style={s.searchInput}
            returnKeyType="search"
            autoCorrect={false}
          />
          {q ? (
            <Tap onPress={() => (setQ(""), setArea(null))} haptic={false}>
              <Icon name="close" size={18} color={C.muted} />
            </Tap>
          ) : null}
        </View>
        {suggestions.length > 0 && (
          <View style={s.suggest}>
            {suggestions.map((a) => (
              <Tap
                key={a.slug}
                onPress={() => {
                  setArea(a);
                  setQ(a.name);
                  setFocus(false);
                  Keyboard.dismiss();
                }}
                style={s.suggestRow}
              >
                <Icon name="pin" size={16} color={C.brand} />
                <View style={{ flex: 1 }}>
                  <T w="semibold">{a.name}</T>
                  <T size={12} color={C.muted}>
                    {a.emirate}
                    {a.nearMetro ? ` · ${a.nearMetro} metro` : ""}
                  </T>
                </View>
              </Tap>
            ))}
          </View>
        )}
      </View>
      <FlatList
        data={results}
        keyExtractor={(l) => l.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 30 }}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        renderItem={({ item, index }) => (
          <View style={{ paddingHorizontal: 20 }}>
            <ListingCard listing={item} delay={Math.min(index, 6) * 50} />
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", padding: 40, gap: 8 }}>
            <T w="bold" size={17}>
              Nothing matches yet
            </T>
            <T color={C.muted} style={{ textAlign: "center" }}>
              Try another area or remove a filter.
            </T>
          </View>
        }
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const s = StyleSheet.create({
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, height: 54, borderRadius: R.pill, borderWidth: 1, borderColor: C.lineStrong, paddingHorizontal: 16, backgroundColor: C.white },
  searchInput: { flex: 1, fontFamily: F.medium, fontSize: 15.5, color: C.ink },
  suggest: { position: "absolute", top: 60, left: 20, right: 20, backgroundColor: C.white, borderRadius: R.md, borderWidth: 1, borderColor: C.line, paddingVertical: 4, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  suggestRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 20, paddingBottom: 10 },
  countRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 },
  sort: { borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 6 },
});
