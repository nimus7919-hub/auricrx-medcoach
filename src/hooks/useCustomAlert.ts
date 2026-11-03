import uiI18n from "../i18n";
import { showSuccessToast } from '../components/SuccessToast';
import { useState } from 'react';

interface AlertOptions {
  type?: 'success';
  title: string;
  message: string;
  buttonText?: string;
  onPress?: () => void;
}

export function useCustomAlert() {
  const [alert, setAlert] = useState<AlertOptions | null>(null);

  const showAlert = (options: AlertOptions) => {
    if (options.type === 'success') {
      showSuccessToast(options.message);
      return;
    }
    setAlert({
      buttonText: uiI18n.t("adminProfile.ok"),
      ...options,
    });
  };

  const hideAlert = () => {
    setAlert(null);
  };

  const handlePress = () => {
    hideAlert();
    alert?.onPress?.();
  };

  return {
    alert,
    showAlert,
    hideAlert,
    handlePress,
  };
}
