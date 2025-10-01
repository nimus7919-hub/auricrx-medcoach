// Simple translation service for missing keys
// This can be enhanced with actual translation APIs like Google Translate, DeepL, etc.

const TRANSLATION_MAP = {
  // Common translations for quick reference
  'en': {
    'notifications': 'Notifications',
    'security': 'Security',
    'privacy': 'Privacy',
    'wallpaper': 'Wallpaper',
    'pushNotifications': 'Push Notifications',
    'emailNotifications': 'Email Notifications',
    'smsNotifications': 'SMS Notifications',
    'changePassword': 'Change Password',
    'dataCollection': 'Data Collection',
    'analytics': 'Analytics',
    'changeWallpaper': 'Change Wallpaper',
    'chooseWallpaperDescription': 'Choose your favorite wallpaper to personalize your app',
    'never': 'Never',
    'refillComplete': 'Refill Complete',
  },
  'es': {
    'notifications': 'Notificaciones',
    'security': 'Seguridad',
    'privacy': 'Privacidad',
    'wallpaper': 'Fondo de Pantalla',
    'pushNotifications': 'Notificaciones Push',
    'emailNotifications': 'Notificaciones por Email',
    'smsNotifications': 'Notificaciones SMS',
    'changePassword': 'Cambiar Contraseña',
    'dataCollection': 'Recopilación de Datos',
    'analytics': 'Análisis',
    'changeWallpaper': 'Cambiar Fondo de Pantalla',
    'chooseWallpaperDescription': 'Elige tu fondo de pantalla favorito para personalizar tu aplicación',
    'never': 'Nunca',
    'refillComplete': 'Recarga Completa',
  },
  'zh': {
    'notifications': '通知',
    'security': '安全',
    'privacy': '隐私',
    'wallpaper': '壁纸',
    'pushNotifications': '推送通知',
    'emailNotifications': '邮件通知',
    'smsNotifications': '短信通知',
    'changePassword': '修改密码',
    'dataCollection': '数据收集',
    'analytics': '分析',
    'changeWallpaper': '更换壁纸',
    'chooseWallpaperDescription': '选择您喜欢的壁纸来个性化您的应用',
    'never': '从未',
    'refillComplete': '续药完成',
  },
  'pt': {
    'notifications': 'Notificações',
    'security': 'Segurança',
    'privacy': 'Privacidade',
    'wallpaper': 'Papel de Parede',
    'pushNotifications': 'Notificações Push',
    'emailNotifications': 'Notificações por Email',
    'smsNotifications': 'Notificações SMS',
    'changePassword': 'Alterar Senha',
    'dataCollection': 'Coleta de Dados',
    'analytics': 'Análises',
    'changeWallpaper': 'Alterar Papel de Parede',
    'chooseWallpaperDescription': 'Escolha seu papel de parede favorito para personalizar seu aplicativo',
    'never': 'Nunca',
    'refillComplete': 'Reabastecimento Concluído',
  },
  'fr': {
    'notifications': 'Notifications',
    'security': 'Sécurité',
    'privacy': 'Confidentialité',
    'wallpaper': 'Fond d\'écran',
    'pushNotifications': 'Notifications Push',
    'emailNotifications': 'Notifications par Email',
    'smsNotifications': 'Notifications SMS',
    'changePassword': 'Changer le mot de passe',
    'dataCollection': 'Collecte de données',
    'analytics': 'Analyses',
    'changeWallpaper': 'Changer le fond d\'écran',
    'chooseWallpaperDescription': 'Choisissez votre fond d\'écran préféré pour personnaliser votre application',
    'never': 'Jamais',
    'refillComplete': 'Réapprovisionnement Terminé',
  },
  'de': {
    'notifications': 'Benachrichtigungen',
    'security': 'Sicherheit',
    'privacy': 'Datenschutz',
    'wallpaper': 'Hintergrundbild',
    'pushNotifications': 'Push-Benachrichtigungen',
    'emailNotifications': 'E-Mail-Benachrichtigungen',
    'smsNotifications': 'SMS-Benachrichtigungen',
    'changePassword': 'Passwort ändern',
    'dataCollection': 'Datensammlung',
    'analytics': 'Analysen',
    'changeWallpaper': 'Hintergrundbild ändern',
    'chooseWallpaperDescription': 'Wählen Sie Ihr Lieblings-Hintergrundbild, um Ihre App zu personalisieren',
    'never': 'Nie',
    'refillComplete': 'Nachfüllen Abgeschlossen',
  }
};

export const getTranslation = (key, language = 'en') => {
  return TRANSLATION_MAP[language]?.[key] || TRANSLATION_MAP['en']?.[key] || key;
};

export const translateKey = (key, fromLang = 'en', toLang = 'es') => {
  // This is a simple fallback - in production, you'd use a real translation API
  const englishValue = TRANSLATION_MAP['en'][key];
  if (!englishValue) return key;
  
  return TRANSLATION_MAP[toLang]?.[key] || englishValue;
};

export default {
  getTranslation,
  translateKey
};
