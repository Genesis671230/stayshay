import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useData } from "@/lib/data";
import { C, R, ROOMMATE_IMAGE } from "@/lib/theme";
import { LIFESTYLE_LABEL, leadMessage, searchAreas, validateLead, type Area, type RoommateLead } from "@/lib/core";
import { logLead, openWhatsapp } from "@/lib/whatsapp";
import { Button, Chip, FadeIn, Field, Icon, ListingCard, T, Tap, aed } from "@/components/ui";
import { FormHero } from "@/components/form-hero";

const LIFESTYLE = [...Object.values(LIFESTYLE_LABEL), "Works from home", "Night shift", "Cooks daily", "Gym regular"];
const BUDGETS = [800, 1200, 1500, 2000, 3000, 4500];
const addDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

export default function Roommates() {
  const { listings, areas, areaBySlug } = useData();
  const profiles = listings.filter((l) => l.type === "roommate");
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

  const submit = () => {
    const check = validateLead({ kind: "roommate", mode, ...f, budget, moveIn, areaSlugs: picked.map((a) => a.slug), lifestyle: tags });
    setErrors(check.errors);
    if (!check.ok || !check.value) return;
    const lead = check.value as RoommateLead;
    logLead("/api/lead", lead);
    openWhatsapp(leadMessage(lead, (s) => areaBySlug.get(s)?.name ?? s));
    setSent(lead);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={{ flex: 1, backgroundColor: C.white }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <FormHero image={ROOMMATE_IMAGE} icon="users" badge="Roommate matching" title="Find a roommate you’d actually live with." text="Tell us about you and how you live. We introduce you to people who fit, on WhatsApp. Free." />

        {sent ? (
          <FadeIn style={s.done}>
            <View style={s.doneIcon}>
              <Icon name="check" size={28} color={C.brand} />
            </View>
            <T w="extrabold" size={24} style={{ textAlign: "center" }}>
              Profile ready, {sent.name.split(" ")[0]}
            </T>
            <T color={C.muted} style={{ textAlign: "center", lineHeight: 21 }}>
              Send the WhatsApp message and we’ll introduce you to matches. Never pay anyone before you’ve met them.
            </T>
            <Button title="Open WhatsApp again" icon="whatsapp" variant="whatsapp" onPress={() => openWhatsapp(leadMessage(sent, (s) => areaBySlug.get(s)?.name ?? s))} />
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

            <Button title="Send my profile on WhatsApp" icon="whatsapp" variant="whatsapp" onPress={submit} />
          </View>
        )}

        {profiles.length > 0 && (
          <View style={{ paddingHorizontal: 20, gap: 14, marginTop: 10 }}>
            <T w="extrabold" size={21}>
              People looking right now
            </T>
            {profiles.map((l, i) => (
              <ListingCard key={l.id} listing={l} delay={i * 60} />
            ))}
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
  doneIcon: { alignSelf: "center", width: 64, height: 64, borderRadius: 32, backgroundColor: C.mint, alignItems: "center", justifyContent: "center" },
});
