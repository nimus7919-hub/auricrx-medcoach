import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  topbar: { 
    borderBottomWidth: 1, 
    paddingBottom: 12, 
    // Top inset applied at runtime via useSafeAreaInsets in TopBar.js
    paddingTop: 12,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  brand: { fontSize: 28 },
  brandButton: {
    padding: 0,
    backgroundColor: 'transparent',
  },
  brandLogo: {
    width: 180,
    height: 70,
  },
  headerHomeButton: {
    padding: 0,
    backgroundColor: 'transparent',
  },
  headerHomeIcon: {
    width: 180,
    height: 70,
  },
  quickRow: { flexDirection: 'row', gap: 18, marginTop: 8, flexWrap: 'wrap' },
  quick: { fontSize: 14 },

  widget: { borderWidth: 2, borderRadius: 18, padding: 12, marginBottom: 16 },
  widgetTitle: { fontSize: 16, marginBottom: 10 },
  widgetInner: { borderRadius: 16, padding: 14 },
  widgetSub: { fontSize: 12, marginBottom: 4 },
  widgetBig: { fontSize: 20, marginBottom: 4 },

  // Clears floating assistant FAB (see src/layout/fabLayout.js)
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingBottom: 100 },
card: {
    width: '46%',
    borderWidth: 2,
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
    minHeight: 120,
  },
  // Slot wraps whatever icon the card provides — never clips with a fixed box.
  cardIconSlot: {
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    minHeight: 32,
  },
  // Sizing for Image-based icons (labs / pharmacy / meds / etc.)
  cardIcon: { width: 32, height: 32 },
  cardIconLarge: { width: 40, height: 40 },
  cardIconExtraLarge: { width: 48, height: 48 },
  quickScanButton: {
    backgroundColor: '#d4af37',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  quickScanButtonText: {
    fontSize: 16,
    color: '#0b1117',
  },
  cardText: { fontSize: 16, textAlign: 'center' },
  cardSubtitle: { fontSize: 12, textAlign: 'center', marginTop: 4 },

  headerTitle: { fontSize: 18 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    // Top inset applied at runtime via useSafeAreaInsets in Header.js
    paddingTop: 8,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },

  section: { borderWidth: 2, borderRadius: 18, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, marginBottom: 8, textAlign: 'center' },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 12,
    paddingHorizontal: 4
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },

  form: { borderWidth: 2, borderRadius: 16, padding: 12, marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },

  row: { borderWidth: 2, padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  btn: { marginTop: 6, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  btnSm: { borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center' },
  btnText: { fontSize: 15 },

  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  thumb: { width: '48%', height: 160, borderRadius: 12 },

  fab: {
    position: 'absolute',
    right: 16,
    // bottom overridden at runtime with safe-area + FAB_BOTTOM_OFFSET
    bottom: 100,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBackdrop: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
  },
  helpModalContainer: {
    width: '100%',
    maxWidth: 600,
    height: '85%',
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  helpModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  helpModalTitle: {
    fontSize: 24,
  },
  helpModalClose: {
    padding: 8,
    borderRadius: 8,
  },
  helpModalContent: {
    flex: 1,
    padding: 20,
  },
  helpModalIntro: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  helpCardItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  helpCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  helpCardIconContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpCardTitle: {
    fontSize: 18,
    flex: 1,
  },
  helpCardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 36,
  },
  sheet: { 
  maxHeight: '80%', 
  borderTopLeftRadius: 18, 
  borderTopRightRadius: 18, 
  borderWidth: 1, 
  padding: 12,
    flex: 1,
},
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  msg: { padding: 10, borderRadius: 12, borderWidth: 1, marginVertical: 4, marginHorizontal: 2 },
  msgUser: { alignSelf: 'flex-end' },
  msgBot: { alignSelf: 'flex-start' },

  aiInputContainer: {
    position: 'relative',
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 80,
    width: '100%',
  },
  aiInputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  aiInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  aiBtn: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emoji: { fontSize: 28, lineHeight: 32, textAlign: 'center' },
});

export const consultStyles = StyleSheet.create({
  fab: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheetWrapper: { width: '100%' },
  sheet: {
    maxHeight: '80%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16, 
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  closeBtn: { padding: 8 },

  bubble: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    maxWidth: '85%',
  },
  user: { alignSelf: 'flex-end' },
  assistant: { alignSelf: 'flex-start' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginRight: 8,
  },
  sendBtn: {      
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
