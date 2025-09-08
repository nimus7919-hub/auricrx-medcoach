import { View, Text, StyleSheet, Pressable, Linking } from "react-native";

export function StoreRow(props: {
  placeId: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  km?: number | null;
  priceable: boolean; // true if name matches San Pablo
  strings: any;
}) {
  const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${props.lat},${props.lng}`;
  return (
    <View style={[styles.row, props.priceable && styles.priceable]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{props.name}{props.priceable ? ` ${props.strings.sanpablo.withPrice}` : ""}</Text>
        {props.address ? <Text style={styles.addr}>{props.address}</Text> : null}
        {typeof props.km === "number" ? <Text style={styles.km}>{props.km.toFixed(1)} km</Text> : null}
      </View>
      <Pressable onPress={() => Linking.openURL(mapUrl)} style={styles.btn}>
        <Text style={styles.btnText}>{props.strings.sanpablo.go}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  priceable: { backgroundColor: "#f6ffed" },
  name: { fontSize: 14, fontWeight: "600" },
  addr: { fontSize: 12, color: "#666", marginTop: 2 },
  km: { fontSize: 11, color: "#888", marginTop: 4 },
  btn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: "#ccc" },
  btnText: { fontWeight: "600" }
});
