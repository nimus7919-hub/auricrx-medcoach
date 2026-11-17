/**
 * Floating assistant (mascot) button layout.
 * Keep in sync with styles.fab in appStyles.js / AnimatedFloatingButton.
 * No new native modules — pure layout constants for OTA-safe padding.
 */
export const FAB_SIZE = 60;
export const FAB_RIGHT = 16;
/** Distance from window bottom to the FAB's bottom edge (clears PremiumTabBar). */
export const FAB_BOTTOM_OFFSET = 100;
/** Extra gap so the last line of text is not flush against the FAB. */
export const FAB_CONTENT_GAP = 24;

/**
 * Bottom padding for scroll/content areas wherever the FAB is visible,
 * so the FAB never covers text or action buttons.
 * = FAB height + edge margin + breathing room (covers FAB top at bottom+size).
 */
export const FAB_SCROLL_PADDING = FAB_SIZE + FAB_RIGHT + FAB_CONTENT_GAP;

/** Absolute top of the FAB from the window bottom (for debugging / layout math). */
export const FAB_TOP_FROM_BOTTOM = FAB_BOTTOM_OFFSET + FAB_SIZE;
