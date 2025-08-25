import * as Linking from "expo-linking";

export type Dest = { lat?: number; lon?: number; address?: string };

export async function openInMaps(dest: Dest) {
  const base = "https://www.google.com/maps/dir/?api=1";
  const destination = dest.lat != null && dest.lon != null
    ? `destination=${dest.lat},${dest.lon}`
    : dest.address
      ? `destination=${encodeURIComponent(dest.address)}`
      : "";
  const url = `${base}&${destination}&travelmode=driving`;
  const supported = await Linking.canOpenURL(url);
  if (supported) return Linking.openURL(url);
  throw new Error("Unable to open maps");
}