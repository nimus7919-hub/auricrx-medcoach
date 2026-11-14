import React, { useState } from 'react';
import Modal from '../../components/BackModal';
import PreVisitIntakeFlow, { type PreVisitIntakeFlowProps } from './PreVisitIntakeFlow';

/** Full-screen host for the intake flow. Only mounted by callers when the feature flag is on. */
export default function PreVisitIntakeModal({ visible, ...flow }: PreVisitIntakeFlowProps & { visible: boolean }) {
  const [closeToken, setCloseToken] = useState(0);
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setCloseToken((n) => n + 1)}>
      {visible ? <PreVisitIntakeFlow {...flow} closeRequestToken={closeToken} /> : null}
    </Modal>
  );
}
