import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { API_URL } from "@/lib/config";
import { useData } from "@/lib/data";
import { C, OWNER_IMAGE, R } from "@/lib/theme";
import { TYPE_LABEL, normalizePhone, searchAreas, type Area, type Gender, type ListingType } from "@/lib/core";
import { openWhatsapp } from "@/lib/whatsapp";
import { Button, Chip, FadeIn, Field, Icon, T, Tap, aed } from "@/components/ui";
import { FormHero } from "@/components/form-hero";

const TYPES: ListingType[] = ["bed_space", "partition", "room", "studio"];
const WHO: [Gender | "couple", string][] = [
  ["any", "Anyone"],
  ["female", "Female"],
  ["male", "Male"],
  ["couple", "Couples"],
];

export default function ListYourPlace() {
  const { listings, areas, areaBySlug } = useData();
  const [type, setType] = useState<ListingType>("bed_space");
  const [areaQ, setAreaQ] = useState("");
  const [area, setArea] = useState<Area | null>(null);
  const [rent, setRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [bills, setBills] = useState(true);
  const [spaces, setSpaces] = useState(1);
  const [who, setWho] = useState<Gender | "couple">("any");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<string | null>(null);
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, selectionLimit: 10 - photos.length, quality: 0.75 });
    if (!res.canceled) setPhotos((p) => [...p, ...res.assets].slice(0, 10));
  };

  const matches = areaQ.trim() && areaQ !== area?.name ? searchAreas(areas, areaQ, 4).map((m) => m.area) : [];
  const typical = useMemo(() => {
    const pool = listings.filter((l) => l.type === type && (!area || l.areaSlug === area.slug));
    const use = pool.length >= 3 ? pool : listings.filter((l) => l.type === type);
    if (!use.length) return null;
    const p = use.map((l) => l.priceAed).sort((a, b) => a - b);
    return { median: p[Math.floor(p.length / 2)], where: pool.length >= 3 && area ? area.name : "the UAE" };
  }, [listings, type, area]);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!area) e.areaSlug = "Pick the area";
    if (!(Number(rent) >= 200)) e.rent = "Enter the monthly rent";
    if (!photos.length) e.photos = "Add at least one photo";
    if (title.trim().length < 6) e.title = "Add a short title";
    if (name.trim().length < 2) e.name = "Enter your name";
    if (!normalizePhone(phone)) e.phone = "Enter a valid WhatsApp number";
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    const body = new FormData();
    body.append(
      "listing",
      JSON.stringify({
        type,
        areaSlug: area!.slug,
        priceAed: Number(rent),
        deposit: Number(deposit) || 0,
        billsIncluded: bills,
        bedsInRoom: type === "bed_space" ? Math.max(2, spaces) : 1,
        bedsAvailable: spaces,
        gender: who === "male" || who === "female" ? who : "any",
        occupancy: who === "couple" ? "couple" : undefined,
        title,
        description,
        listerName: name,
        listerPhone: phone,
        source: "app",
      }),
    );
    // React Native's FormData takes { uri, name, type } file descriptors.
    photos.forEach((p, i) => body.append("photos", { uri: p.uri, name: p.fileName ?? `photo-${i + 1}.jpg`, type: p.mimeType ?? "image/jpeg" } as unknown as Blob));
    const res = await fetch(`${API_URL}/api/listings/submit`, { method: "POST", body }).catch(() => null);
    const j = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) {
      setErrors({ form: j?.error ?? Object.values(j?.errors ?? {}).join(", ") ?? "Something went wrong. Try again." });
      return;
    }
    setSent(j.id);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={{ flex: 1, backgroundColor: C.white }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <FormHero image={OWNER_IMAGE} icon="key" badge="Free for owners" title="List your place in two minutes." text="Add the details and photos. Our team reviews it, then it goes live on the website and app." />

        {sent ? (
          <FadeIn style={{ padding: 24, gap: 14 }}>
            <View style={s.doneIcon}>
              <Icon name="check" size={28} color={C.brand} />
            </View>
            <T w="extrabold" size={24} style={{ textAlign: "center" }}>
              Submitted for review
            </T>
            <T color={C.muted} style={{ textAlign: "center", lineHeight: 21 }}>
              Ref {sent}. Our team checks every listing before it goes public, usually within a few hours. We’ll WhatsApp you when it’s live.
            </T>
            <Button title="Message the team" icon="whatsapp" variant="whatsapp" onPress={() => openWhatsapp(`Hi Stayshay, I just submitted listing ${sent}.`)} />
            <Button
              title="List another place"
              variant="outline"
              onPress={() => {
                setSent(null);
                setPhotos([]);
                setTitle("");
                setDescription("");
              }}
            />
          </FadeIn>
        ) : (
          <View style={{ padding: 20, gap: 18 }}>
            <View style={{ gap: 8 }}>
              <T w="semibold" size={13}>
                What are you renting out?
              </T>
              <View style={s.wrap}>
                {TYPES.map((t) => (
                  <Chip key={t} label={TYPE_LABEL[t]} active={type === t} onPress={() => setType(t)} />
                ))}
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <Field label="Area" value={areaQ} onChangeText={(v) => (setAreaQ(v), setArea(null))} placeholder="Type an area or metro" error={errors.areaSlug} />
              {matches.length > 0 && (
                <View style={s.wrap}>
                  {matches.map((a) => (
                    <Chip key={a.slug} label={a.name} active={false} onPress={() => (setArea(a), setAreaQ(a.name))} />
                  ))}
                </View>
              )}
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="Rent (AED / month)" value={rent} onChangeText={(v) => setRent(v.replace(/\D/g, ""))} keyboardType="number-pad" error={errors.rent} placeholder={typical ? String(typical.median) : "1500"} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Deposit (AED)" value={deposit} onChangeText={(v) => setDeposit(v.replace(/\D/g, ""))} keyboardType="number-pad" placeholder="0" />
              </View>
            </View>
            {typical && (
              <View style={s.tip}>
                <Icon name="info" size={16} color={C.brand} />
                <T size={13} color={C.brand} style={{ flex: 1 }}>
                  Typical {TYPE_LABEL[type].toLowerCase()} rent in {typical.where}: <T w="bold" size={13} color={C.brand}>{aed(typical.median)}</T>
                </T>
              </View>
            )}

            <View style={s.wrap}>
              <Chip tone="mint" label="Bills included" active={bills} onPress={() => setBills(true)} />
              <Chip tone="mint" label="Bills extra" active={!bills} onPress={() => setBills(false)} />
            </View>

            <View style={{ gap: 8 }}>
              <T w="semibold" size={13}>
                {type === "bed_space" ? "Beds available" : "Spaces available"}
              </T>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <Chip label="−" active={false} onPress={() => setSpaces(Math.max(1, spaces - 1))} />
                <T w="extrabold" size={20}>
                  {spaces}
                </T>
                <Chip label="+" active={false} onPress={() => setSpaces(Math.min(50, spaces + 1))} />
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <T w="semibold" size={13}>
                Who can live there?
              </T>
              <View style={s.wrap}>
                {WHO.map(([v, label]) => (
                  <Chip key={v} label={label} active={who === v} onPress={() => setWho(v)} />
                ))}
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <T w="semibold" size={13}>
                Photos ({photos.length}/10)
              </T>
              <View style={s.wrap}>
                {photos.map((p, i) => (
                  <Tap key={p.uri} onPress={() => setPhotos(photos.filter((_, j) => j !== i))} style={s.thumb}>
                    <Image source={{ uri: p.uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                  </Tap>
                ))}
                {photos.length < 10 && (
                  <Tap onPress={pick} style={[s.thumb, s.addThumb]}>
                    <Icon name="plus" size={22} color={C.brand} />
                  </Tap>
                )}
              </View>
              <T size={12} color={photos.length ? C.muted : errors.photos ? C.warn : C.muted}>
                {errors.photos ?? "Room, bathroom, kitchen. Tap a photo to remove it."}
              </T>
            </View>
            <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Partition near Mall of the Emirates metro" error={errors.title} maxLength={100} />
            <Field label="Description" hint="(optional)" value={description} onChangeText={setDescription} multiline maxLength={3000} style={{ height: 100, paddingTop: 12, textAlignVertical: "top" }} placeholder="What’s included, house rules, transport…" />

            <Field label="Your name" value={name} onChangeText={setName} error={errors.name} />
            <Field label="WhatsApp number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="050 123 4567" error={errors.phone} />

            {errors.form ? (
              <T size={13} color={C.warn}>
                {errors.form}
              </T>
            ) : null}
            <Button title={busy ? "Submitting…" : "Submit for review"} onPress={submit} disabled={busy} />
            <T size={12} color={C.muted} style={{ textAlign: "center" }}>
              Partitions and bed spaces need landlord consent and the applicable permit.
            </T>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  thumb: { width: 76, height: 76, borderRadius: 14, overflow: "hidden", backgroundColor: C.ivory },
  addThumb: { borderWidth: 2, borderStyle: "dashed", borderColor: C.lineStrong, alignItems: "center", justifyContent: "center" },
  tip: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: C.mint, borderRadius: R.md, padding: 12 },
  doneIcon: { alignSelf: "center", width: 64, height: 64, borderRadius: 32, backgroundColor: C.mint, alignItems: "center", justifyContent: "center" },
});
