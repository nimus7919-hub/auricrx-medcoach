import { useState } from 'react';

interface AlertOptions {
  title: string;
  message: string;
  buttonText?: string;
  onPress?: () => void;
}

export function useCustomAlert() {
  const [alert, setAlert] = useState<AlertOptions | null>(null);

  const showAlert = (options: AlertOptions) => {
    setAlert({
      buttonText: 'OK',
      ...options,
    });
  };

  const hideAlert = () => {
    setAlert(null);
  };

  const handlePress = () => {
    if (alert?.onPress) {
      alert.onPress();
    }
    hideAlert();
  };

  return {
    alert,
    showAlert,
    hideAlert,
    handlePress,
  };
}
