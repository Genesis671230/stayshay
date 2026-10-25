import { useMemo } from "react";
import { ActivityIndicator, FlatList, Linking, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/lib/data";
import { C, HERO_IMAGE, OWNER_IMAGE, R, ROOMMATE_IMAGE, shadow } from "@/lib/theme";
import { WEB_URL } from "@/lib/config";
import { fromPriceByType, type Listing, type ListingType } from "@/lib/core";
import { Button, FadeIn, Icon, ListingCard, Logo, T, Tap, aed } from "@/components/ui";
import { Shay } from "@/components/shay";

const CATS: { type: ListingType; title: string; line: string }[] = [
  { type: "bed_space", title: "Bed space", line: "Shared room, own bed" },
  { type: "partition", title: "Partition", line: "Your own partition" },
  { type: "room", title: "Private room", line: "Your own door" },
  { type: "studio", title: "Studio", line: "A place of your own" },
];

const newest = (a: Listing, b: Listing) => (b.postedAt ?? "").localeCompare(a.postedAt ?? "");

function Rail({ title, sub, items, query }: { title: string; sub: string; items: Listing[]; query: string }) {
  if (items.length < 2) return null;
  return (
    <View style={{ marginTop: 30 }}>
      <View style={s.railHead}>
        <View style={{ flex: 1 }}>
          <T w="extrabold" size={21}>
            {title}
          </T>
          <T size={13.5} color={C.muted}>
            {sub}
          </T>
        </View>
        <Tap onPress={() => router.push(`/search?${query}`)} style={s.seeAll}>
          <T w="bold" size={13} color={C.brand}>
            See all
          </T>
        </Tap>
      </View>
      <FlatList
        horizontal
        data={items.slice(0, 8)}
        keyExtractor={(l) => l.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingVertical: 14 }}
        renderItem={({ item, index }) => <ListingCard listing={item} width={268} delay={index * 60} />}
      />
    </View>
  );
}

export default function Explore() {
  const { listings, loading, error, refresh, areaBySlug, announcement } = useData();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const from = fromPriceByType(listings);
  const min = listings.length ? Math.min(...listings.map((l) => l.priceAed)) : 0;

  const rails = useMemo(() => {
    const rich = listings.filter((l) => l.photos.length);
    return {
      bed: rich.filter((l) => l.type === "bed_space").sort(newest),
      partitions: rich.filter((l) => l.type === "partition" && l.nearMetroMinutes != null && l.nearMetroMinutes <= 12),
      rooms: rich.filter((l) => l.type === "room" && l.priceAed <= 2500),
      allIn: rich.filter((l) => l.billsIncluded && !l.deposit),
    };
  }, [listings]);

  const cover = (t: ListingType) => listings.find((l) => l.type === t && l.photos.length)?.photos[0];
  const popular = useMemo(
    () =>
      [...new Set(listings.map((l) => l.areaSlug))]
        .map((slug) => ({ slug, n: listings.filter((l) => l.areaSlug === slug).length }))
        .sort((a, b) => b.n - a.n)
        .slice(0, 6),
    [listings],
  );

  return (
    <View style={{ flex: 1 }}>
    <ScrollView style={{ flex: 1, backgroundColor: C.white }} refreshControl={<RefreshControl refreshing={loading && listings.length > 0} onRefresh={refresh} tintColor={C.brand} />} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={[s.hero, { paddingTop: insets.top + 14 }]}>
        <Image source={{ uri: HERO_IMAGE }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: C.heroTint }]} />
        <FadeIn>
          <Logo light />
        </FadeIn>
        <FadeIn delay={120} style={{ marginTop: 34 }}>
          <View style={s.badge}>
            <Icon name="shield" size={13} color={C.brand} />
            <T w="semibold" size={12} color={C.brand}>
              Verified listings · real monthly prices
            </T>
          </View>
          <T w="extrabold" size={38} color={C.white} style={{ marginTop: 14, lineHeight: 42 }}>
            Find your space.
          </T>
          <T w="extrabold" size={38} color={C.light} style={{ lineHeight: 42 }}>
            Pay less. Live better.
          </T>
          <T size={15} color="rgba(255,255,255,0.85)" style={{ marginTop: 10, lineHeight: 22 }}>
            Bed spaces, partitions, rooms and studios across the UAE{min ? `, from ${aed(min)} a month` : ""}.
          </T>
        </FadeIn>
        <FadeIn delay={220}>
          <Tap onPress={() => router.push("/search")} style={s.searchPill}>
            <Icon name="search" size={20} color={C.brand} />
            <View style={{ flex: 1 }}>
              <T w="bold" size={15}>
                Where do you want to live?
              </T>
              <T size={12.5} color={C.muted}>
                Area, metro or community
              </T>
            </View>
            <View style={s.searchGo}>
              <Icon name="arrow" size={18} color={C.white} />
            </View>
          </Tap>
        </FadeIn>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 14 }}>
          {popular.map(({ slug }) => (
            <Tap key={slug} onPress={() => router.push(`/search?area=${slug}`)} style={s.areaChip}>
              <T w="semibold" size={12.5} color={C.white}>
                {areaBySlug.get(slug)?.name ?? slug}
              </T>
            </Tap>
          ))}
        </ScrollView>
      </View>

      {loading && !listings.length ? (
        <View style={s.state}>
          <ActivityIndicator color={C.brand} />
          <T color={C.muted}>Finding places…</T>
        </View>
      ) : error && !listings.length ? (
        <View style={s.state}>
          <T w="bold" size={17}>
            Can’t reach Stayshay
          </T>
          <T color={C.muted} style={{ textAlign: "center" }}>
            {error}
          </T>
          <Button title="Try again" onPress={refresh} style={{ marginTop: 8 }} />
        </View>
      ) : (
        <>
          {announcement && (
            <FadeIn style={{ marginHorizontal: 20, marginTop: 18 }}>
              <Tap onPress={() => announcement.link && Linking.openURL(announcement.link)} style={s.notice}>
                <View style={s.noticeDot} />
                <View style={{ flex: 1 }}>
                  <T w="bold" size={14.5} color={C.white}>
                    {announcement.title}
                  </T>
                  <T size={13} color="rgba(255,255,255,0.85)" style={{ marginTop: 2, lineHeight: 19 }}>
                    {announcement.message}
                  </T>
                </View>
              </Tap>
            </FadeIn>
          )}
          {/* Stats */}
          <View style={s.stats}>
            {[
              [listings.length, "places"],
              [new Set(listings.map((l) => l.areaSlug)).size, "areas"],
              [listings.filter((l) => !l.deposit).length, "no deposit"],
            ].map(([n, label]) => (
              <View key={label as string} style={{ alignItems: "center", flex: 1 }}>
                <T w="extrabold" size={24} color={C.brand}>
                  {String(n)}
                </T>
                <T size={12} color={C.muted}>
                  {label as string}
                </T>
              </View>
            ))}
          </View>

          {/* Categories */}
          <View style={{ paddingHorizontal: 20, marginTop: 26 }}>
            <T w="extrabold" size={21}>
              Choose how you live
            </T>
          </View>
          <View style={s.catGrid}>
            {CATS.map((c, i) => (
              <FadeIn key={c.type} delay={i * 70} style={{ width: (width - 40 - 12) / 2 }}>
                <Tap onPress={() => router.push(`/search?type=${c.type}`)} style={s.catCard}>
                  <Image source={{ uri: cover(c.type) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
                  <View style={s.catLabel}>
                    <T w="bold" size={14.5}>
                      {c.title}
                    </T>
                    <T size={11.5} color={C.muted}>
                      {from[c.type] != null ? `from ${aed(from[c.type]!)}` : c.line}
                    </T>
                  </View>
                </Tap>
              </FadeIn>
            ))}
          </View>

          <Rail title="Fresh bed spaces" sub="Newest first" items={rails.bed} query="type=bed_space" />
          <Rail title="Partitions near the metro" sub="12 minutes’ walk or less" items={rails.partitions} query="type=partition&metro=1" />
          <Rail title="Rooms under AED 2,500" sub="Your own door, shared kitchen" items={rails.rooms} query="type=room&max=2500" />
          <Rail title="Bills included, no deposit" sub="Move in with just the first month" items={rails.allIn} query="bills=1&nodeposit=1" />

          {/* Two doors */}
          <View style={{ paddingHorizontal: 20, gap: 14, marginTop: 30 }}>
            {[
              { img: ROOMMATE_IMAGE, title: "Find a roommate", text: "Share a flat with people who fit your budget and routine.", go: "/roommates", cta: "Create my profile" },
              { img: OWNER_IMAGE, title: "Have a room to rent?", text: "List for free. Send details on WhatsApp, we build the listing.", go: "/list", cta: "List your place" },
            ].map((d, i) => (
              <FadeIn key={d.title} delay={i * 80}>
                <Tap onPress={() => router.push(d.go as never)} style={[s.door, shadow]}>
                  <Image source={{ uri: d.img }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(15,74,56,0.72)" }]} />
                  <T w="extrabold" size={22} color={C.white}>
                    {d.title}
                  </T>
                  <T size={14} color="rgba(255,255,255,0.85)" style={{ marginTop: 4, marginBottom: 14 }}>
                    {d.text}
                  </T>
                  <View style={s.doorCta}>
                    <T w="bold" size={13.5} color={C.brand}>
                      {d.cta}
                    </T>
                    <Icon name="arrow" size={15} color={C.brand} />
                  </View>
                </Tap>
              </FadeIn>
            ))}
          </View>

          <View style={s.footer}>
            {[
              ["About", "/about"],
              ["Terms", "/terms"],
              ["Privacy", "/privacy"],
            ].map(([t, p]) => (
              <Tap key={p} onPress={() => Linking.openURL(`${WEB_URL}${p}`)} haptic={false}>
                <T w="semibold" size={13} color={C.muted}>
                  {t}
                </T>
              </Tap>
            ))}
          </View>
        </>
      )}
    </ScrollView>
      {/* Shay: floating assistant button */}
      <Tap onPress={() => router.push("/chat")} style={[s.shayFab, shadow]} accessibilityLabel="Chat with Shay, the Stayshay assistant">
        <Shay size={46} waving />
      </Tap>
    </View>
  );
}

const s = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: "hidden", backgroundColor: C.brandDeep },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: C.mint, borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 6 },
  searchPill: { marginTop: 22, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.white, borderRadius: R.lg, paddingLeft: 16, paddingRight: 8, paddingVertical: 10 },
  searchGo: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.brand, alignItems: "center", justifyContent: "center" },
  areaChip: { borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 7 },
  stats: { flexDirection: "row", marginHorizontal: 20, marginTop: -1, paddingVertical: 18, borderBottomWidth: 1, borderColor: C.line },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 20, marginTop: 14 },
  catCard: { height: 170, borderRadius: R.lg, overflow: "hidden", backgroundColor: C.ivory, justifyContent: "flex-end", padding: 8 },
  catLabel: { backgroundColor: "rgba(255,255,255,0.96)", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8 },
  railHead: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 20, gap: 10 },
  seeAll: { borderWidth: 1, borderColor: C.line, borderRadius: R.pill, paddingHorizontal: 14, paddingVertical: 8 },
  door: { borderRadius: R.xl, overflow: "hidden", padding: 22, backgroundColor: C.brand },
  doorCta: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: C.white, borderRadius: R.pill, paddingHorizontal: 16, paddingVertical: 10 },
  state: { alignItems: "center", gap: 10, padding: 40 },
  shayFab: { position: "absolute", right: 18, bottom: 18, width: 66, height: 66, borderRadius: 33, backgroundColor: C.white, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.line },
  notice: { flexDirection: "row", gap: 12, backgroundColor: C.brandDeep, borderRadius: R.lg, padding: 16 },
  noticeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.fresh, marginTop: 5 },
  footer: { flexDirection: "row", justifyContent: "center", gap: 24, paddingVertical: 36 },
});
