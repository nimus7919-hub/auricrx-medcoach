import React from 'react';
import Modal from './BackModal';
import USReferenceScreen from '../screens/USReferenceScreen';
export default function USRefillModal({ visible, onClose, medication, supplement }) {
  return <Modal visible={visible} onRequestClose={onClose} animationType="slide"><USReferenceScreen onClose={onClose} initialMode="nadac" initialQuery="" drugName={(medication || supplement)?.name || ''} key={(medication || supplement)?.name || 'prices'} /></Modal>;
}
