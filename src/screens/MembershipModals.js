import { View, TouchableOpacity, Modal } from "react-native";
import { useWallpaper } from "./../contexts/WallpaperContext";
import DynamicText from "./../components/DynamicText";

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createMembershipModals(getScope) {
  return () => {
    const { showCancelMembershipModal, setShowCancelMembershipModal, showMembershipResultModal, setShowMembershipResultModal, membershipResult, confirmCancelMembership, S } = getScope();

    const { getCardBackgroundColor, getCardBorderColor } = useWallpaper();
    
    return (
      <>
        {/* Cancel Membership Confirmation Modal */}
        <Modal
          visible={showCancelMembershipModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCancelMembershipModal(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20
          }}>
            <View style={{
              backgroundColor: getCardBackgroundColor() + 'F0',
              borderRadius: 16,
              padding: 24,
              width: '90%',
              maxWidth: 400,
              borderWidth: 2,
              borderColor: getCardBorderColor(),
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 10
            }}>
              <DynamicText type="card" style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 20,
                marginBottom: 16,
                textAlign: 'center'
              }}>
                {S.cancelMembership || 'Cancel Membership'}
              </DynamicText>
              
              <DynamicText type="card" style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 15,
                marginBottom: 24,
                textAlign: 'center',
                opacity: 0.8,
                lineHeight: 22
              }}>
                {S.cancelMembershipConfirm || 'Cancel membership. You keep Pro until the end of the paid period. No more charges. You can resubscribe anytime.'}
              </DynamicText>
              
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setShowCancelMembershipModal(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: getCardBackgroundColor() + '80',
                    borderWidth: 2,
                    borderColor: getCardBorderColor(),
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <DynamicText type="card" style={{
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 15
                  }}>
                    {S.cancel || 'Cancel'}
                  </DynamicText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={confirmCancelMembership}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: '#f59e0b',
                    borderWidth: 2,
                    borderColor: '#d97706',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#f59e0b',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 5
                  }}
                >
                  <DynamicText type="card" style={{
                    fontFamily: 'Inter_700Bold',
                    fontSize: 15,
                    color: '#ffffff'
                  }}>
                    {S.confirmCancel || 'Yes, Cancel Membership'}
                  </DynamicText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        
        {/* Membership Result Modal */}
        <Modal
          visible={showMembershipResultModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMembershipResultModal(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20
          }}>
            <View style={{
              backgroundColor: getCardBackgroundColor() + 'F0',
              borderRadius: 16,
              padding: 24,
              width: '90%',
              maxWidth: 400,
              borderWidth: 2,
              borderColor: membershipResult.type === 'success' ? '#22c55e' : '#ef4444',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 10
            }}>
              <DynamicText type="card" style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 20,
                marginBottom: 16,
                textAlign: 'center',
                color: membershipResult.type === 'success' ? '#22c55e' : '#ef4444'
              }}>
                {membershipResult.title}
              </DynamicText>
              
              <DynamicText type="card" style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 15,
                marginBottom: 24,
                textAlign: 'center',
                opacity: 0.8,
                lineHeight: 22
              }}>
                {membershipResult.message}
              </DynamicText>
              
              <TouchableOpacity
                onPress={() => setShowMembershipResultModal(false)}
                style={{
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: membershipResult.type === 'success' ? '#22c55e' : '#ef4444',
                  borderWidth: 2,
                  borderColor: membershipResult.type === 'success' ? '#16a34a' : '#dc2626',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: membershipResult.type === 'success' ? '#22c55e' : '#ef4444',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 5
                }}
              >
                <DynamicText type="card" style={{
                  fontFamily: 'Inter_700Bold',
                  fontSize: 15,
                  color: '#ffffff'
                }}>
                  {S.ok || 'OK'}
                </DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </>
    );
  };
}
