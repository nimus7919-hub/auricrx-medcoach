import { Text, TouchableOpacity } from "react-native";

import { styles } from "./appStyles";

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createAnimatedFloatingButton(getScope) {
  return () => {
    const { lang, selectedAIDoctor, S, setAiOpen, getInitialAIMessage, setAiMessages } = getScope();

    const getDoctorDisplayName = (doctorKey) => {
      const names = {
        'alfred': S.drAlfred || 'Alfred',
        'mimi': S.drMimi || 'Mimi',
        'pawlmer': S.pawlmer || 'Pawlmer'
      };
      return names[doctorKey] || (S.drAlfred || 'Alfred');
    };

    return (
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: 'transparent' }]}
        onPress={() => {
          setAiOpen(true);
          // Always show the selected doctor's greeting when opening AI
          const newIntro = getInitialAIMessage(selectedAIDoctor);
          setAiMessages([{ role: 'assistant', text: newIntro }]);
        }}
        activeOpacity={0.8}
      >
        <Text accessibilityLabel={lang === 'es' ? 'Asistente de IA' : 'AI assistant'} style={{ fontSize: 32 }}>{selectedAIDoctor === 'pawlmer' ? '\u{1F431}' : '\u{1F4AC}'}</Text>
      </TouchableOpacity>
    );
  };
}
