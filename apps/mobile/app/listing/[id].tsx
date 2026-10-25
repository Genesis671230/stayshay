import { useState } from "react";
import { Dimensions, FlatList, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/lib/data";
import { C, R } from "@/lib/theme";
import { TYPE_LABEL, validateInquiry, whatsappMessage, type InquiryErrors } from "@/lib/core";
import { logLead, openWhatsapp } from "@/lib/whatsapp";
import { Button, Chip, FadeIn, Field, Icon, ListingCard, T, Tag, Tap, aed, tagsFor } from "@/components/ui";

const W = Dimensions.get("window").width;
const addDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

export default function ListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { listings, areaBySlug, saved, toggleSaved } = useData();
  const insets = useSafeAreaInsets();
  const l = listings.find((x) => x.id.toLowerCase() === String(id).toLowerCase());
  const [page, setPage] = useState(0);
  const [sheet, setSheet] = useState(false);
  const [f, setF] = useState({ name: "", phone: "", moveIn: addDays(7), people: "1" });
  const [errors, setErrors] = useState<InquiryErrors>({});

  if (!l) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 30 }}>
        <T w="bold" size={18}>
          This place isn’t available any more
        </T>
        <Button title="Back to search" onPress={() => router.replace("/search")} />
      </View>
    );
  }

  const area = areaBySlug.get(l.areaSlug)?.name ?? l.areaName ?? "";
  const similar = listings.filter((x) => x.id !== l.id && (x.areaSlug === l.areaSlug || x.type === l.type)).slice(0, 6);
  const facts: [string, string][] = [
    ["Rent", l.priceMaxAed ? `${aed(l.priceAed)} – ${aed(l.priceMaxAed)}` : aed(l.priceAed)],
    ["Deposit", l.deposit ? aed(l.deposit) : "None"],
    ["Upfront cost", l.upfrontCost ? aed(l.upfrontCost) : "None"],
    ["Utilities", l.utilities ?? (l.billsIncluded ? "Included" : "Not included")],
    ["Availability", l.availability ?? "Ask"],
    ["Minimum stay", l.minimumStay ?? `${l.minStayMonths} month${l.minStayMonths > 1 ? "s" : ""}`],
    ["Bathroom", l.bathroom ?? "Ask"],
    ["Sleeping set", l.sleepingSet ?? "Ask"],
  ];
  if (l.maxCapacity) facts.push(["Max people", String(l.maxCapacity)]);
  if (l.noticePeriod) facts.push(["Notice", l.noticePeriod]);
  const point = l.lat && l.lng ? `${l.lat},${l.lng}` : null;

  const send = () => {
    const check = validateInquiry({ listingId: l.id, name: f.name, phone: f.phone, moveIn: f.moveIn, budget: l.priceAed, message: f.people !== "1" ? `${f.people} people` : "" });
    setErrors(check.errors);
    if (!check.ok || !check.value) return;
    logLead("/api/inquiry", { ...check.value, via: "app" });
    setSheet(false);
    openWhatsapp(whatsappMessage(l, check.value));
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.white }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View>
          <FlatList
            horizontal
            pagingEnabled
            data={l.photos.length ? l.photos : [""]}
            keyExtractor={(p, i) => p + i}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / W))}
            renderItem={({ item }) => <Image source={{ uri: item }} style={{ width: W, height: W * 0.9, backgroundColor: C.ivory }} contentFit="cover" transition={250} />}
          />
          <View style={[s.topBar, { top: insets.top + 8 }]}>
            <Tap onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={s.round}>
              <Icon name="back" size={20} />
            </Tap>
            <Tap onPress={() => toggleSaved(l.id)} style={s.round}>
              <Icon name="heart" size={19} color={saved.has(l.id) ? C.brand : C.ink} fill={saved.has(l.id) ? C.brand : "none"} />
            </Tap>
          </View>
          {l.photos.length > 1 && (
            <View style={s.counter}>
              <T w="bold" size={12} color={C.white}>
                {page + 1} / {l.photos.length}
              </T>
            </View>
          )}
        </View>

        <FadeIn style={s.sheetTop}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            <Tag label={l.typeName ?? TYPE_LABEL[l.type]} tone="ivory" />
            {l.verifiedLister ? <Tag label="Verified listing" /> : null}
            {tagsFor(l).map((t) => (
              <Tag key={t} label={t} />
            ))}
          </View>
          <T w="extrabold" size={26} style={{ marginTop: 12, lineHeight: 31 }}>
            {l.title}
          </T>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
            <Icon name="pin" size={16} color={C.brand} />
            <T color={C.ink2}>{area}</T>
          </View>
          {l.metro ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
              <Icon name="train" size={16} color={C.brand} />
              <T color={C.ink2}>
                {l.metro} metro{l.nearMetroMinutes != null ? ` · ${l.nearMetroMinutes} min walk` : ""}
              </T>
            </View>
          ) : null}

          <View style={s.grid}>
            {facts.map(([k, v]) => (
              <View key={k} style={s.fact}>
                <T size={12} color={C.muted}>
                  {k}
                </T>
                <T w="bold" size={14.5} style={{ marginTop: 2 }}>
                  {v}
                </T>
              </View>
            ))}
          </View>

          {(l.descriptionLines?.length || l.description) && (
            <View style={{ marginTop: 24, gap: 6 }}>
              <T w="extrabold" size={19}>
                About this place
              </T>
              {(l.descriptionLines?.length ? l.descriptionLines : [l.description]).map((line, i) => (
                <T key={i} color={C.ink2} style={{ lineHeight: 23 }}>
                  {line}
                </T>
              ))}
            </View>
          )}

          {!!l.features?.length && (
            <View style={{ marginTop: 24, gap: 10 }}>
              <T w="extrabold" size={19}>
                What’s included
              </T>
              {l.features.map((x) => (
                <View key={x} style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                  <Icon name="check" size={17} color={C.fresh} />
                  <T color={C.ink2}>{x}</T>
                </View>
              ))}
            </View>
          )}

          {!!l.preferredTenant?.length && (
            <View style={{ marginTop: 24, gap: 10 }}>
              <T w="extrabold" size={19}>
                Who can live here
              </T>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {[...l.preferredTenant, ...(l.preferredNationality ?? [])].map((x) => (
                  <Tag key={x} label={x} tone="ivory" />
                ))}
              </View>
            </View>
          )}

          <View style={{ marginTop: 24, gap: 10 }}>
            <T w="extrabold" size={19}>
              Where you’ll be
            </T>
            <Tap onPress={() => Linking.openURL(point ? `https://www.google.com/maps/search/?api=1&query=${point}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${area}, UAE`)}`)} style={s.mapCard}>
              <View style={s.mapIcon}>
                <Icon name="pin" size={22} color={C.white} />
              </View>
              <View style={{ flex: 1 }}>
                <T w="bold">{area}</T>
                <T size={12.5} color={C.muted}>
                  {point ? "Open the exact pin in Maps" : "Open the area in Maps"}
                </T>
              </View>
              <Icon name="arrow" size={18} color={C.brand} />
            </Tap>
          </View>

          <View style={s.safe}>
            <Icon name="shield" size={18} color={C.brand} />
            <T size={13.5} color={C.brand} style={{ flex: 1, lineHeight: 20 }}>
              View the place and meet the lister before you pay anything. Stayshay never asks for money on WhatsApp.
            </T>
          </View>
        </FadeIn>

        {similar.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <T w="extrabold" size={19} style={{ paddingHorizontal: 20 }}>
              More like this
            </T>
            <FlatList
              horizontal
              data={similar}
              keyExtractor={(x) => x.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ padding: 20, gap: 14 }}
              renderItem={({ item }) => <ListingCard listing={item} width={250} />}
            />
          </View>
        )}
      </ScrollView>

      <View style={[s.bar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={{ flex: 1 }}>
          <T w="extrabold" size={19}>
            {l.priceMaxAed ? "From " : ""}
            {aed(l.priceAed)}
          </T>
          <T size={12.5} color={C.muted}>
            per month{l.billsIncluded ? " · bills included" : ""}
          </T>
        </View>
        <Button title="Request viewing" onPress={() => setSheet(true)} />
      </View>

      <Modal visible={sheet} transparent animationType="slide" onRequestClose={() => setSheet(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} onPress={() => setSheet(false)} />
          <View style={[s.modal, { paddingBottom: insets.bottom + 18 }]}>
            <View style={s.grabber} />
            <T w="extrabold" size={22}>
              Request a viewing
            </T>
            <T size={13.5} color={C.muted} style={{ marginTop: 2, marginBottom: 14 }}>
              We’ll send your details to the lister on WhatsApp. Free, no booking fee.
            </T>
            <View style={{ gap: 14 }}>
              <View style={{ gap: 8 }}>
                <T w="semibold" size={13}>
                  Move in
                </T>
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  {[
                    ["This week", 3],
                    ["Next week", 7],
                    ["Next month", 30],
                  ].map(([label, d]) => (
                    <Chip key={label as string} tone="mint" label={label as string} active={f.moveIn === addDays(d as number)} onPress={() => setF({ ...f, moveIn: addDays(d as number) })} />
                  ))}
                </View>
              </View>
              <View style={{ gap: 8 }}>
                <T w="semibold" size={13}>
                  People
                </T>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {["1", "2", "3+"].map((p) => (
                    <Chip key={p} tone="mint" label={p === "1" ? "Just me" : p} active={f.people === p} onPress={() => setF({ ...f, people: p })} />
                  ))}
                </View>
              </View>
              <Field label="Your name" value={f.name} onChangeText={(v) => setF({ ...f, name: v })} error={errors.name} autoComplete="name" />
              <Field label="WhatsApp number" value={f.phone} onChangeText={(v) => setF({ ...f, phone: v })} keyboardType="phone-pad" placeholder="050 123 4567" error={errors.phone} />
              <Button title="Send on WhatsApp" icon="whatsapp" variant="whatsapp" onPress={send} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  topBar: { position: "absolute", left: 16, right: 16, flexDirection: "row", justifyContent: "space-between" },
  round: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.95)", alignItems: "center", justifyContent: "center" },
  counter: { position: "absolute", right: 16, bottom: 34, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 4 },
  sheetTop: { marginTop: -22, backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 20, borderTopWidth: 1, borderColor: C.line },
  fact: { width: "50%", paddingVertical: 12, paddingRight: 10, borderBottomWidth: 1, borderColor: C.line },
  mapCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.ivory, borderRadius: R.lg, padding: 14 },
  mapIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.brand, alignItems: "center", justifyContent: "center" },
  safe: { flexDirection: "row", gap: 10, marginTop: 24, backgroundColor: C.mint, borderRadius: R.lg, padding: 14 },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.white, borderTopWidth: 1, borderColor: C.line, paddingHorizontal: 20, paddingTop: 12 },
  modal: { backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10 },
  grabber: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: C.lineStrong, marginBottom: 14 },
});
