import { useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_URL } from "@/lib/config";
import { BRAND } from "@/lib/core";
import { C, F, R } from "@/lib/theme";
import { Button, Icon, T, Tap } from "@/components/ui";
import { Shay } from "@/components/shay";

type Msg = { role: "user" | "assistant"; text: string };
const STARTERS = ["Bed space under AED 1,000 in Karama", "Female partition near the metro", "مرحبا، أبحث عن غرفة", "I need a roommate"];

/** Shay's replies with links made tappable (listing links open in the app). */
function Rich({ text, color }: { text: string; color: string }) {
  const parts = text.split(/(https?:\/\/[^\s)]+)/g);
  return (
    <Text style={{ fontFamily: F.regular, fontSize: 15, lineHeight: 22, color }}>
      {parts.map((p, i) => {
        if (!/^https?:\/\//.test(p)) return p;
        const id = p.match(/\/listing\/([a-z0-9]+)/i)?.[1];
        return (
          <Text key={i} style={{ fontFamily: F.bold, color: C.brand, textDecorationLine: "underline" }} onPress={() => (id ? router.push(`/listing/${id.toUpperCase()}`) : Linking.openURL(p))}>
            {id ? `View ${id.toUpperCase()}` : p.replace(/^https?:\/\//, "")}
          </Text>
        );
      })}
    </Text>
  );
}

export default function Chat() {
  const insets = useSafeAreaInsets();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const list = useRef<FlatList<Msg>>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/agent`)
      .then((r) => r.json())
      .then((j) => setEnabled(!!j.enabled))
      .catch(() => setEnabled(false));
  }, []);

  const send = async (raw: string) => {
    const message = raw.trim();
    if (!message || busy) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: message }]);
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/agent`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chatId, message }) });
      const j = await res.json();
      if (j.chatId) setChatId(j.chatId);
      setMsgs((m) => [...m, { role: "assistant", text: j.reply ?? `I'm having trouble right now. WhatsApp the team: ${BRAND.whatsappDisplay}` }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", text: `I couldn't connect. WhatsApp the team on ${BRAND.whatsappDisplay}.` }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.ivory }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[s.head, { paddingTop: insets.top + 8 }]}>
        <Tap onPress={() => router.back()} style={s.back}>
          <Icon name="back" size={20} color={C.white} />
        </Tap>
        <View style={s.avatar}>
          <Shay size={34} mood={busy ? "talking" : "happy"} glow={false} />
        </View>
        <View style={{ flex: 1 }}>
          <T w="bold" size={17} color={C.white}>
            Shay
          </T>
          <T size={12} color="rgba(255,255,255,0.75)">
            Stayshay assistant · speaks your language
          </T>
        </View>
      </View>

      {enabled === false ? (
        <View style={s.center}>
          <Shay size={120} mood="happy" />
          <T w="bold" size={18} style={{ marginTop: 14 }}>
            Shay is taking a short break
          </T>
          <T color={C.muted} style={{ textAlign: "center", marginTop: 4, marginBottom: 16 }}>
            Our team answers on WhatsApp right away.
          </T>
          <Button title={`WhatsApp ${BRAND.whatsappDisplay}`} icon="whatsapp" variant="whatsapp" onPress={() => Linking.openURL(`https://wa.me/${BRAND.whatsapp}`)} />
        </View>
      ) : (
        <>
          <FlatList
            ref={list}
            data={msgs}
            keyExtractor={(_, i) => String(i)}
            onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            ListHeaderComponent={
              <View style={{ gap: 10 }}>
                <View style={s.row}>
                  <Shay size={30} glow={false} />
                  <View style={s.bot}>
                    <Rich color={C.ink} text="Hi! I'm Shay. Tell me where you want to live, your budget and when you'll move, and I'll find places that fit. Write in any language you like." />
                  </View>
                </View>
                {!msgs.length && (
                  <View style={s.starters}>
                    {STARTERS.map((t) => (
                      <Tap key={t} onPress={() => send(t)} style={s.starter}>
                        <T w="medium" size={13} color={C.ink2}>
                          {t}
                        </T>
                      </Tap>
                    ))}
                  </View>
                )}
              </View>
            }
            renderItem={({ item }) =>
              item.role === "user" ? (
                <View style={[s.user]}>
                  <T color={C.white} size={15} style={{ lineHeight: 22 }}>
                    {item.text}
                  </T>
                </View>
              ) : (
                <View style={s.row}>
                  <Shay size={30} glow={false} />
                  <View style={s.bot}>
                    <Rich color={C.ink} text={item.text} />
                  </View>
                </View>
              )
            }
            ListFooterComponent={
              busy ? (
                <View style={[s.row, { marginTop: 10 }]}>
                  <Shay size={30} mood="thinking" glow={false} />
                  <View style={s.bot}>
                    <T color={C.muted}>Shay is typing…</T>
                  </View>
                </View>
              ) : undefined
            }
          />
          <View style={[s.composer, { paddingBottom: insets.bottom + 10 }]}>
            <TextInput value={input} onChangeText={setInput} placeholder="Message Shay…" placeholderTextColor={C.muted} style={s.input} multiline maxLength={2000} onSubmitEditing={() => send(input)} />
            <Tap onPress={() => send(input)} style={[s.send, (!input.trim() || busy) && { opacity: 0.4 }]}>
              <Icon name="arrow" size={19} color={C.white} />
            </Tap>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.brand, paddingHorizontal: 14, paddingBottom: 12 },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
  row: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  bot: { flexShrink: 1, backgroundColor: C.white, borderRadius: R.lg, borderBottomLeftRadius: 6, paddingHorizontal: 14, paddingVertical: 10 },
  user: { alignSelf: "flex-end", maxWidth: "85%", backgroundColor: C.brand, borderRadius: R.lg, borderBottomRightRadius: 6, paddingHorizontal: 14, paddingVertical: 10 },
  starters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  starter: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 8 },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8, backgroundColor: C.white, borderTopWidth: 1, borderColor: C.line, paddingHorizontal: 12, paddingTop: 10 },
  input: { flex: 1, minHeight: 44, maxHeight: 120, borderWidth: 1, borderColor: C.line, borderRadius: 22, paddingHorizontal: 16, paddingTop: 11, fontFamily: F.regular, fontSize: 15, color: C.ink },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.brand, alignItems: "center", justifyContent: "center" },
});
