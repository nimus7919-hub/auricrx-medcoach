import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import { Text, TouchableOpacity } from "react-native";

import { styles } from "./appStyles";

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createAnimatedFloatingButton(getScope) {
  return () => {
  useUILanguage();
    const { lang, selectedAIDoctor, S, setAiOpen, getInitialAIMessage, setAiMessages } = getScope();

    const getDoctorDisplayName = (doctorKey) => {
      const names = {
        'alfred': S.drAlfred || uiI18n.t("ai.drAlfred"),
        'mimi': S.drMimi || uiI18n.t("ai.drMimi"),
        'pawlmer': S.pawlmer || uiI18n.t("ai.pawlmer")
      };
      return names[doctorKey] || (S.drAlfred || uiI18n.t("ai.drAlfred"));
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
        <Text accessibilityLabel={uiI18n.t("localized.AnimatedFloatingButton.text33")} style={{ fontSize: 32 }}>{selectedAIDoctor === uiI18n.t("ai.pawlmer") ? '\u{1F431}' : '\u{1F4AC}'}</Text>
      </TouchableOpacity>
    );
  };
}
