import React, { forwardRef, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

// Keep long medicine and ingredient names readable without expanding the whole form.
export default forwardRef(function GrowingTextInput({ style, onContentSizeChange = undefined, ...props }, ref) {
  const [contentHeight, setContentHeight] = useState(0);
  const flat = StyleSheet.flatten(style) || {};
  const lineHeight = flat.lineHeight || (flat.fontSize || 16) * 1.4;
  const padding = (flat.paddingTop ?? flat.paddingVertical ?? flat.padding ?? 0)
    + (flat.paddingBottom ?? flat.paddingVertical ?? flat.padding ?? 0);
  const minHeight = Math.max(flat.minHeight || 0, lineHeight + padding);
  const maxHeight = Math.max(minHeight, lineHeight * 3 + padding);
  return <TextInput {...props} ref={ref} multiline textAlignVertical="top"
    scrollEnabled={contentHeight > maxHeight}
    style={[style, { height: Math.min(maxHeight, Math.max(minHeight, contentHeight)), minHeight, maxHeight, textAlignVertical: 'top' }]}
    onContentSizeChange={event => {
      setContentHeight(event.nativeEvent.contentSize.height);
      onContentSizeChange?.(event);
    }} />;
});
