import { Text, TouchableOpacity } from "react-native";
import { useWallpaper } from "./../contexts/WallpaperContext";

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createTrialWidget(getScope) {
  return () => {
    const { subscriptionStatus, setShowCheckout } = getScope();

    const { getCardBackgroundColor, getCardBorderColor } = useWallpaper();
    
    if (!subscriptionStatus || subscriptionStatus.plan === 'pro') {
      return null;
    }
    
    const daysLeft = subscriptionStatus.daysLeft || 0;
    const isExpired = subscriptionStatus.status === 'expired';
    const isGrace = subscriptionStatus.status === 'grace';
    
    return (
      <TouchableOpacity
        onPress={() => setShowCheckout(true)}
        activeOpacity={0.7}
        style={{
          marginRight: 8,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12,
          backgroundColor: getCardBackgroundColor() + 'DD',
          borderWidth: 1,
          borderColor: getCardBorderColor(),
        }}
      >
        {isExpired ? (
          <Text style={{ color: '#ef4444', fontSize: 11, fontFamily: 'Inter_700Bold' }}>
            Trial Expired
          </Text>
        ) : isGrace ? (
          <Text style={{ color: '#f59e0b', fontSize: 11, fontFamily: 'Inter_700Bold' }}>
            Grace: {daysLeft}d
          </Text>
        ) : (
          <Text style={{ color: '#22c55e', fontSize: 11, fontFamily: 'Inter_700Bold' }}>
            Trial: {daysLeft}d
          </Text>
        )}
      </TouchableOpacity>
    );
  };
}
