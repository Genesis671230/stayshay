import { useEffect, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { API_URL } from "@/lib/config";
import { useData } from "@/lib/data";
import { C, R, ROOMMATE_IMAGE } from "@/lib/theme";
import { LIFESTYLE_LABEL, leadMessage, searchAreas, validateLead, type Area, type RoommateLead } from "@/lib/core";
import { openWhatsapp } from "@/lib/whatsapp";
import { Button, Chip, FadeIn, Field, Icon, T, Tap, aed } from "@/components/ui";
import { FormHero } from "@/components/form-hero";

const LIFESTYLE = [...Object.values(LIFESTYLE_LABEL), "Works from home", "Night shift", "Cooks daily", "Gym regular"];
const BUDGETS = [800, 1200, 1500, 2000, 3000, 4500];
const addDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

type PublicRoommate = { id: string; mode: string; firstName: string; age: number | null; gender: string; nationality: string; profession: string; budget: number; areaSlugs: string[]; moveIn: string; lifestyle: string[]; about: string; photo: string | null };

function BoardCard({ p, areaName }: { p: PublicRoommate; areaName: (s: string) => string }) {
  return (
    <View style={s.board}>
      <View style={s.boardImg}>
        {p.photo ? <Image source={{ uri: `${API_URL}${p.photo}` }} style={{ width: "100%", height: "100%" }} contentFit="cover" /> : <T w="extrabold" size={36} color={C.brand}>{p.firstName[0]}</T>}
        <View style={[s.modeTag, p.mode === "has_place" && { backgroundColor: C.brand }]}>
          <T w="bold" size={11} color={p.mode === "has_place" ? C.white : C.brand}>
            {p.mode === "has_place" ? "Has a place" : "Looking"}
          </T>
        </View>
      </View>
      <View style={{ padding: 12, gap: 3 }}>
        <T w="bold" size={15.5}>
          {p.firstName}
          {p.age ? `, ${p.age}` : ""}
        </T>
        <T size={12.5} color={C.muted} numberOfLines={1}>
          {aed(p.budget)}/mo · {p.areaSlugs.map(areaName).join(", ") || "Any area"}
        </T>
        {p.about ? (
          <T size={12.5} color={C.ink2} numberOfLines={2} style={{ fontStyle: "italic" }}>
            “{p.about}”
          </T>
        ) : null}
        <Tap onPress={() => openWhatsapp(`Hi Stayshay, I'd like to connect with ${p.firstName} (roommate profile ${p.id}).`)} style={s.connect}>
          <Icon name="whatsapp" size={15} color={C.white} />
          <T w="bold" size={13} color={C.white}>
            Connect
          </T>
        </Tap>
      </View>
    </View>
  );
}

export default function Roommates() {
  const { areas, areaBySlug } = useData();
  const [profiles, setProfiles] = useState<PublicRoommate[]>([]);
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch(`${API_URL}/api/roommates`)
      .then((r) => r.json())
      .then((j) => setProfiles(j.profiles ?? []))
      .catch(() => {});
  }, []);
  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!res.canceled && res.assets[0]) setPhoto(res.assets[0]);
  };
  const [mode, setMode] = useState<"looking" | "has_place">("looking");
  const [f, setF] = useState({ name: "", phone: "", age: "", gender: "", nationality: "", profession: "", about: "" });
  const [budget, setBudget] = useState(1500);
  const [moveIn, setMoveIn] = useState(addDays(14));
  const [areaQ, setAreaQ] = useState("");
  const [picked, setPicked] = useState<Area[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<RoommateLead | null>(null);

  const matches = areaQ.trim() ? searchAreas(areas, areaQ, 4).map((m) => m.area) : [];

  const submit = async () => {
    const payload = { kind: "roommate", mode, ...f, budget, moveIn, areaSlugs: picked.map((a) => a.slug), lifestyle: tags };
    const check = validateLead(payload);
    setErrors(check.errors);
    if (!check.ok || !check.value) return;
    setBusy(true);
    const body = new FormData();
    body.append("profile", JSON.stringify({ ...payload, public: isPublic, source: "app" }));
    if (photo && isPublic) {
      // React Native's FormData takes a { uri, name, type } file descriptor.
      body.append("photo", { uri: photo.uri, name: photo.fileName ?? "photo.jpg", type: photo.mimeType ?? "image/jpeg" } as unknown as Blob);
    }
    const res = await fetch(`${API_URL}/api/roommates`, { method: "POST", body }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      setErrors({ form: "We couldn't save that. Check your connection and try again." });
      return;
    }
    setSent(check.value as RoommateLead);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={{ flex: 1, backgroundColor: C.white }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <FormHero image={ROOMMATE_IMAGE} icon="users" badge="Roommate matching" title="Find a roommate you’d actually live with." text="Browse people already looking, or add your profile with a photo. We introduce you on WhatsApp. Free." />

        <View style={{ paddingTop: 22 }}>
          <T w="extrabold" size={21} style={{ paddingHorizontal: 20 }}>
            People looking right now
          </T>
          {profiles.length ? (
            <FlatList
              horizontal
              data={profiles}
              keyExtractor={(p) => p.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ padding: 20, gap: 12 }}
              renderItem={({ item }) => <BoardCard p={item} areaName={(x) => areaBySlug.get(x)?.name ?? x} />}
            />
          ) : (
            <T color={C.muted} style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
              Be one of the first: create your profile below.
            </T>
          )}
        </View>

        {sent ? (
          <FadeIn style={s.done}>
            <View style={s.doneIcon}>
              <Icon name="check" size={28} color={C.brand} />
            </View>
            <T w="extrabold" size={24} style={{ textAlign: "center" }}>
              Profile ready, {sent.name.split(" ")[0]}
            </T>
            <T color={C.muted} style={{ textAlign: "center", lineHeight: 21 }}>
              {isPublic ? "Our team will check your profile and put it on the board. " : ""}We’ll WhatsApp you when someone fits. Never pay anyone before you’ve met them.
            </T>
            <Button title="Say hi on WhatsApp" icon="whatsapp" variant="whatsapp" onPress={() => openWhatsapp(leadMessage(sent, (s) => areaBySlug.get(s)?.name ?? s))} />
            <Button title="Edit my profile" variant="outline" onPress={() => setSent(null)} />
          </FadeIn>
        ) : (
          <View style={{ padding: 20, gap: 18 }}>
            <View style={s.modeRow}>
              {(
                [
                  ["looking", "Looking to share"],
                  ["has_place", "I have a place"],
                ] as const
              ).map(([m, label]) => (
                <Tap key={m} onPress={() => setMode(m)} style={[s.mode, mode === m && s.modeOn]}>
                  <T w="bold" size={13} color={mode === m ? C.white : C.ink2} numberOfLines={1}>
                    {label}
                  </T>
                </Tap>
              ))}
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <Tap onPress={pickPhoto} style={s.photo}>
                {photo ? <Image source={{ uri: photo.uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" /> : <Icon name="users" size={26} color={C.brand} />}
              </Tap>
              <View style={{ flex: 1 }}>
                <T w="bold" size={14.5}>
                  {photo ? "Looking good!" : "Add a profile photo"}
                </T>
                <T size={12.5} color={C.muted}>
                  A friendly photo gets far more replies. Tap the circle.
                </T>
              </View>
            </View>

            <Field label="Name" value={f.name} onChangeText={(v) => setF({ ...f, name: v })} error={errors.name} autoComplete="name" />
            <Field label="WhatsApp number" value={f.phone} onChangeText={(v) => setF({ ...f, phone: v })} error={errors.phone} keyboardType="phone-pad" placeholder="050 123 4567" />

            <View style={{ gap: 8 }}>
              <T w="semibold" size={13}>
                I am
              </T>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Chip label="Female" active={f.gender === "female"} onPress={() => setF({ ...f, gender: "female" })} />
                <Chip label="Male" active={f.gender === "male"} onPress={() => setF({ ...f, gender: "male" })} />
              </View>
              {errors.gender ? (
                <T size={12.5} color={C.warn}>
                  {errors.gender}
                </T>
              ) : null}
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="Age" hint="(optional)" value={f.age} onChangeText={(v) => setF({ ...f, age: v.replace(/\D/g, "") })} keyboardType="number-pad" error={errors.age} />
              </View>
              <View style={{ flex: 2 }}>
                <Field label="Nationality" hint="(optional)" value={f.nationality} onChangeText={(v) => setF({ ...f, nationality: v })} />
              </View>
            </View>
            <Field label="Work" hint="(optional)" value={f.profession} onChangeText={(v) => setF({ ...f, profession: v })} placeholder="e.g. Nurse, retail, student" />

            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <T w="semibold" size={13}>
                  {mode === "has_place" ? "Rent for the roommate" : "My budget"}
                </T>
                <T w="extrabold" size={13} color={C.brand}>
                  {aed(budget)} / month
                </T>
              </View>
              <View style={s.wrap}>
                {BUDGETS.map((b) => (
                  <Chip key={b} tone="mint" label={b.toLocaleString("en-US")} active={budget === b} onPress={() => setBudget(b)} />
                ))}
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <Field label={mode === "has_place" ? "Where is the place?" : "Areas I’d live in"} value={areaQ} onChangeText={setAreaQ} placeholder="Type an area or metro" />
              {matches.length > 0 && (
                <View style={s.wrap}>
                  {matches.map((a) => (
                    <Chip
                      key={a.slug}
                      label={`+ ${a.name}`}
                      active={false}
                      onPress={() => {
                        if (!picked.some((x) => x.slug === a.slug) && picked.length < 5) setPicked([...picked, a]);
                        setAreaQ("");
                      }}
                    />
                  ))}
                </View>
              )}
              {picked.length > 0 && (
                <View style={s.wrap}>
                  {picked.map((a) => (
                    <Chip key={a.slug} label={`${a.name}  ✕`} active onPress={() => setPicked(picked.filter((x) => x.slug !== a.slug))} />
                  ))}
                </View>
              )}
            </View>

            <View style={{ gap: 8 }}>
              <T w="semibold" size={13}>
                Move-in
              </T>
              <View style={s.wrap}>
                {[
                  ["ASAP", 0],
                  ["In 2 weeks", 14],
                  ["Next month", 30],
                ].map(([label, d]) => (
                  <Chip key={label as string} tone="mint" label={label as string} active={moveIn === addDays(d as number)} onPress={() => setMoveIn(addDays(d as number))} />
                ))}
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <T w="semibold" size={13}>
                How I live
              </T>
              <View style={s.wrap}>
                {LIFESTYLE.map((t) => (
                  <Chip key={t} tone="mint" label={t} active={tags.includes(t)} onPress={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])} />
                ))}
              </View>
            </View>

            <Field label="A bit about you" hint="(optional)" value={f.about} onChangeText={(v) => setF({ ...f, about: v })} multiline style={{ height: 96, paddingTop: 12, textAlignVertical: "top" }} maxLength={400} />

            <View style={s.publicRow}>
              <View style={{ flex: 1 }}>
                <T w="bold" size={14}>
                  Show me on the public board
                </T>
                <T size={12.5} color={C.muted}>
                  First name, photo, age, budget, areas. Never your number. Checked by our team first.
                </T>
              </View>
              <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: C.brand, false: C.lineStrong }} />
            </View>
            {errors.form ? (
              <T size={13} color={C.warn}>
                {errors.form}
              </T>
            ) : null}
            <Button title={busy ? "Saving…" : isPublic ? "Publish my profile" : "Send my profile"} onPress={submit} disabled={busy} />
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  modeRow: { flexDirection: "row", backgroundColor: C.ivory, borderRadius: R.pill, padding: 4 },
  mode: { flex: 1, alignItems: "center", paddingVertical: 12, paddingHorizontal: 6, borderRadius: R.pill },
  modeOn: { backgroundColor: C.brand },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  done: { padding: 24, gap: 14, alignItems: "stretch" },
  board: { width: 210, backgroundColor: C.white, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, overflow: "hidden" },
  boardImg: { height: 150, backgroundColor: C.mint, alignItems: "center", justifyContent: "center" },
  modeTag: { position: "absolute", left: 8, top: 8, backgroundColor: C.white, borderRadius: R.pill, paddingHorizontal: 9, paddingVertical: 4 },
  connect: { marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: C.whatsapp, borderRadius: R.pill, height: 36 },
  photo: { width: 76, height: 76, borderRadius: 38, borderWidth: 2, borderStyle: "dashed", borderColor: C.lineStrong, backgroundColor: C.ivory, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  publicRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.ivory, borderRadius: R.md, padding: 14 },
  doneIcon: { alignSelf: "center", width: 64, height: 64, borderRadius: 32, backgroundColor: C.mint, alignItems: "center", justifyContent: "center" },
});
