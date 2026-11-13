import React from 'react';
import { Text } from 'react-native';

/**
 * Renders a subset of markdown: **bold** segments. Other text is plain.
 * Strips unpaired ** markers so Alfred replies never show raw asterisks.
 */
export function parseBoldSegments(text) {
  if (!text) return [{ text: '', bold: false }];
  const segments = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ text: text.slice(last, match.index), bold: false });
    }
    segments.push({ text: match[1], bold: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    segments.push({ text: text.slice(last).replace(/\*\*/g, ''), bold: false });
  }
  if (!segments.length) segments.push({ text: '', bold: false });
  return segments;
}

export default function MarkdownText({ text, style, boldStyle }) {
  const segments = parseBoldSegments(text);
  return (
    <Text style={style}>
      {segments.map((seg, i) =>
        seg.bold ? (
          <Text key={i} style={[{ fontFamily: 'Inter_700Bold' }, boldStyle]}>
            {seg.text}
          </Text>
        ) : (
          <Text key={i}>{seg.text}</Text>
        )
      )}
    </Text>
  );
}
