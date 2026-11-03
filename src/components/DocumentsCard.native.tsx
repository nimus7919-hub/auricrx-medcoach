import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import React, { useEffect, useState } from "react";
import { View, Text, Button, FlatList, Image, Alert, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";

export default function DocumentsCard() {
  useUILanguage();
  const [items, setItems] = useState<Array<{ id: string; uri: string }>>([]);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(uiI18n.t("ui.permissionRequired"), uiI18n.t("ui.cameraPermissionIsRequiredToScanDocuments"));
      }
    })();
  }, []);

  const pickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.9, base64: false });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        const id = String(Date.now());
        setItems((s) => [{ id, uri }, ...s]);
      }
    } catch (e) {
      Alert.alert(uiI18n.t("adminProfile.error"), String(e));
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({ quality: 0.9, base64: false });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        const id = String(Date.now());
        setItems((s) => [{ id, uri }, ...s]);
      }
    } catch (e) {
      Alert.alert(uiI18n.t("adminProfile.error"), String(e));
    }
  };

  const removeItem = (id: string) => {
    setItems((s) => s.filter((it) => it.id !== id));
  };

  const exportPdf = async () => {
    if (items.length === 0) {
      Alert.alert(uiI18n.t("ui.noDocuments"), uiI18n.t("ui.addOrScanImagesFirst"));
      return;
    }

    try {
      // Build simple HTML with embedded base64 images
      const parts: string[] = [];
      for (const it of items) {
        const base64 = await FileSystem.readAsStringAsync(it.uri, { encoding: FileSystem.EncodingType.Base64 });
        // infer mime type from extension
        const ext = it.uri.split('.').pop()?.toLowerCase() || 'jpg';
        const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
        parts.push(`<div style="page-break-after: always"><img src="data:${mime};base64,${base64}" style="width:100%;height:auto;"/></div>`);
      }

      const html = `<html><body>${parts.join('')}</body></html>`;

      const { uri: pdfUri } = await Print.printToFileAsync({ html });

      // Offer share and also keep a copy in documentDirectory
      const dest = FileSystem.documentDirectory + `documents-${Date.now()}.pdf`;
      await FileSystem.copyAsync({ from: pdfUri, to: dest });

      Alert.alert(uiI18n.t("ui.pdfCreated"), uiI18n.t("ui.savedToValue", { value1: dest }));
      return { pdfUri: dest };
    } catch (e) {
      Alert.alert(uiI18n.t("ui.exportError"), String(e));
    }
  };

  const sharePdf = async () => {
    const res = await exportPdf();
    if (!res || !res.pdfUri) return;
    try {
      await shareAsync(res.pdfUri, { mimeType: 'application/pdf' });
    } catch (e) {
      Alert.alert(uiI18n.t("ui.shareFailed"), String(e));
    }
  };

  const downloadPdf = async () => {
    const res = await exportPdf();
    if (!res || !res.pdfUri) return;
    Alert.alert(uiI18n.t("ui.download"), uiI18n.t("ui.pdfSavedToValue", { value1: res.pdfUri }));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{uiI18n.t("ui.documentsMobile")}</Text>

      <View style={styles.row}>
        <Button title={uiI18n.t("ui.scanCamera")} onPress={takePhoto} />
        <View style={styles.spacer} />
        <Button title={uiI18n.t("ui.upload")} onPress={pickFromLibrary} />
      </View>

      <View style={{ height: 12 }} />

      <View style={styles.row}>
        <Button title={uiI18n.t("documents.exportPDF")} onPress={exportPdf} />
        <View style={styles.spacer} />
        <Button title={uiI18n.t("ui.sharePdf")} onPress={sharePdf} />
        <View style={styles.spacer} />
        <Button title={uiI18n.t("ui.download")} onPress={downloadPdf} />
      </View>

      <View style={{ height: 12 }} />

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Image source={{ uri: item.uri }} style={styles.image} />
            <View style={styles.itemButtons}>
              <Button title={uiI18n.t("ai.delete")} onPress={() => removeItem(item.id)} />
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#666' }}>{uiI18n.t("ui.noPagesYetScanOrUploadImages")}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  spacer: { width: 12 },
  item: { marginTop: 12, borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, flexDirection: 'row' },
  image: { width: 120, height: 160, resizeMode: 'cover', marginRight: 8 },
  itemButtons: { justifyContent: 'center' },
});
