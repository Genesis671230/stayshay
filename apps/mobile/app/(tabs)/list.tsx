import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useData } from "@/lib/data";
import { C, OWNER_IMAGE, R } from "@/lib/theme";
import { TYPE_LABEL, leadMessage, searchAreas, validateLead, type Area, type Gender, type ListingType, type OwnerLead } from "@/lib/core";
import { logLead, openWhatsapp } from "@/lib/whatsapp";
import { Button, Chip, FadeIn, Field, Icon, T, aed } from "@/components/ui";
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
  const [sent, setSent] = useState<OwnerLead | null>(null);

  const matches = areaQ.trim() && areaQ !== area?.name ? searchAreas(areas, areaQ, 4).map((m) => m.area) : [];
  const typical = useMemo(() => {
    const pool = listings.filter((l) => l.type === type && (!area || l.areaSlug === area.slug));
    const use = pool.length >= 3 ? pool : listings.filter((l) => l.type === type);
    if (!use.length) return null;
    const p = use.map((l) => l.priceAed).sort((a, b) => a - b);
    return { median: p[Math.floor(p.length / 2)], where: pool.length >= 3 && area ? area.name : "the UAE" };
  }, [listings, type, area]);

  const submit = () => {
    const check = validateLead({ kind: "owner", type, areaSlug: area?.slug, rent, deposit, billsIncluded: bills, spaces, household: who, name, phone });
    setErrors(check.errors);
    if (!check.ok || !check.value) return;
    const lead = check.value as OwnerLead;
    logLead("/api/lead", lead);
    openWhatsapp(leadMessage(lead, (s) => areaBySlug.get(s)?.name ?? s));
    setSent(lead);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={{ flex: 1, backgroundColor: C.white }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <FormHero image={OWNER_IMAGE} icon="key" badge="Free for owners" title="List your place in two minutes." text="Tell us the basics, then send photos on WhatsApp. Our team builds and checks the listing for you." />

        {sent ? (
          <FadeIn style={{ padding: 24, gap: 14 }}>
            <View style={s.doneIcon}>
              <Icon name="check" size={28} color={C.brand} />
            </View>
            <T w="extrabold" size={24} style={{ textAlign: "center" }}>
              Now send your photos
            </T>
            <T color={C.muted} style={{ textAlign: "center", lineHeight: 21 }}>
              In the WhatsApp chat, send 4 to 8 bright photos of the room, bathroom and kitchen. Your {TYPE_LABEL[sent.type].toLowerCase()} goes live once we’ve checked it.
            </T>
            <Button title="Open WhatsApp" icon="whatsapp" variant="whatsapp" onPress={() => openWhatsapp(leadMessage(sent, (x) => areaBySlug.get(x)?.name ?? x))} />
            <Button title="List another place" variant="outline" onPress={() => setSent(null)} />
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

            <Field label="Your name" value={name} onChangeText={setName} error={errors.name} />
            <Field label="WhatsApp number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="050 123 4567" error={errors.phone} />

            <Button title="Send details on WhatsApp" icon="whatsapp" variant="whatsapp" onPress={submit} />
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
  tip: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: C.mint, borderRadius: R.md, padding: 12 },
  doneIcon: { alignSelf: "center", width: 64, height: 64, borderRadius: 32, backgroundColor: C.mint, alignItems: "center", justifyContent: "center" },
});
