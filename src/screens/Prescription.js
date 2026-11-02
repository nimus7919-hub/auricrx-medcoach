import PremiumButton from "./../components/PremiumButton";
import { View, Text, ScrollView, Image } from "react-native";

import { styles } from "./appStyles";

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createPrescription(getScope) {
  return () => {
    const { S, rxPhotos, theme, addRxPhoto, exportRxToPDF, Header } = getScope();
    return (<ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      <Header title={S.prescription} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <PremiumButton style={[styles.btnSm, { backgroundColor: theme.accent }]} onPress={addRxPhoto}>
            <Text style={[styles.btnText, { color: '#ffffff', fontFamily: 'Inter_800ExtraBold' }]}>{S.addPhoto}</Text>
          </PremiumButton>
          <PremiumButton style={[styles.btnSm, { backgroundColor: theme.accent }]} onPress={exportRxToPDF}>
            <Text style={[styles.btnText, { color: '#ffffff', fontFamily: 'Inter_800ExtraBold' }]}>{S.toPDF}</Text>
          </PremiumButton>
        </View>

        <View style={styles.gallery}>
          {rxPhotos.map(p => (
            <Image key={p.id} source={{ uri: p.uri }} style={styles.thumb} />
          ))}
        </View>
      </ScrollView>
  );
  };
}
