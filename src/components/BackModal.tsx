import React from 'react';
import { Modal, ModalProps } from 'react-native';
import { useBackDismiss } from '../navigation/useAndroidBackNavigation';

// Keep native Modal presentation and topmost-window handling, including sheets.
// Registration also clears the double-back exit window when an overlay changes.
export default function BackModal(props: ModalProps) {
  useBackDismiss(props.visible !== false, () => {
    props.onRequestClose?.({} as any);
  });
  return <Modal {...props} />;
}
