import { View, Image, Text, StyleSheet } from "react-native";

export function PriceCard(props: {
  name: string | null;
  price: string | null;
  pack: string | null;
  image: string | null;
  strings: any;
}) {
  return (
    <View style={styles.card}>
      {props.image ? <Image source={{ uri: props.image }} style={styles.img} /> : null}
      <View style={{ flex: 1 }}>
        <Text numberOfLines={2} style={styles.name}>{props.name ?? props.strings.sanpablo.productName}</Text>
        <Text style={styles.price}>{props.price ?? props.strings.sanpablo.priceUnavailable}</Text>
        {props.pack ? <Text style={styles.pack}>{props.pack}</Text> : null}
        <Text style={styles.chain}>{props.strings.sanpablo.chain}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", gap: 12, padding: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, marginBottom: 10, backgroundColor: "white" },
  img: { width: 56, height: 56, borderRadius: 6, backgroundColor: "#f3f3f3" },
  name: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  price: { fontSize: 16, fontWeight: "700" },
  pack: { fontSize: 12, color: "#666", marginTop: 2 },
  chain: { fontSize: 11, color: "#888", marginTop: 6 }
});
