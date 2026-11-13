import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import { Image, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getAICharacter } from '../utils/aiCharacters';
import { FAB_BOTTOM_OFFSET, FAB_SIZE } from '../layout/fabLayout';

import { styles } from "./appStyles";

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createAnimatedFloatingButton(getScope) {
  return () => {
  useUILanguage();
    const insets = useSafeAreaInsets();
    const { lang, selectedAIDoctor, S, setAiOpen, getInitialAIMessage, setAiMessages } = getScope();

    const getDoctorDisplayName = (doctorKey) => {
      const names = {
        'alfred': S.alfred || uiI18n.t("ai.alfred"),
        'mimi': S.mimi || uiI18n.t("ai.mimi"),
        'pawlmer': S.pawlmer || uiI18n.t("ai.pawlmer")
      };
      return names[doctorKey] || (S.alfred || uiI18n.t("ai.alfred"));
    };

    // Keep FAB above the tab bar; nudge up on devices with a home indicator.
    const bottom = FAB_BOTTOM_OFFSET + Math.max(insets.bottom - 8, 0);

    return (
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: 'transparent', bottom, width: FAB_SIZE, height: FAB_SIZE }]}
        onPress={() => {
          setAiOpen(true);
          // Always show the selected doctor's greeting when opening AI
          const newIntro = getInitialAIMessage(selectedAIDoctor);
          setAiMessages([{ role: 'assistant', text: newIntro }]);
        }}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={getDoctorDisplayName(selectedAIDoctor)}
      >
        <Image source={getAICharacter(selectedAIDoctor).avatar} accessibilityLabel={getDoctorDisplayName(selectedAIDoctor)} style={{ width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: getAICharacter(selectedAIDoctor).border }} />
      </TouchableOpacity>
    );
  };
}
