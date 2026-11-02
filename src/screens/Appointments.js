import PremiumButton from "./../components/PremiumButton";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";

import { styles } from "./appStyles";

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createAppointments(getScope) {
  return () => {
    const { S, voiceNotes, theme, isRecording, toggleRecord, playNote, Header } = getScope();
    return (<ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      <Header title="Appointments" />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <PremiumButton style={[styles.btnSm, { backgroundColor: theme.accent }]} onPress={toggleRecord}>
            <Text style={[styles.btnText, { color: '#ffffff', fontFamily: 'Inter_800ExtraBold' }]}>{isRecording ? S.stop : S.record}</Text>
          </PremiumButton>
        </View>
        <Text style={{ color: theme.sub, marginTop: 8, fontFamily: 'Inter_600SemiBold' }}>{isRecording ? S.recording : ' '}</Text>

        {voiceNotes.map(n => (
          <View key={n.id} style={[styles.row, { backgroundColor: theme.card, borderColor: theme.chip, marginTop: 12 }]}>
            <Text style={{ color: theme.text, flex: 1, fontFamily: 'Inter_400Regular' }}>{new Date(n.createdAt).toLocaleString()}</Text>
            <TouchableOpacity onPress={() => playNote(n.uri)}><Text style={{ color: theme.sub, fontFamily: 'Inter_600SemiBold' }}>{S.play}</Text></TouchableOpacity>
          </View>
        ))}
      </ScrollView>
  );
  };
}
