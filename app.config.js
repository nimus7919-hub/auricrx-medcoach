  // app.config.js
  import 'dotenv/config';

  export default ({ config }) => ({
    ...config,
    owner: 'firef1',
    name: 'AuricRx MedCoach',
    slug: 'auricrx-medcoach',
    scheme: 'auricrx-medcoach',
    version: '1.0.0',
    orientation: 'portrait',
    platforms: ['ios', 'android'],

    // Config plugins
    plugins: [
      'expo-router',
      'expo-localization',
      'expo-font',
      // 'expo-camera' // not required unless you want the plugin's custom options
    ['expo-location', {
        locationWhenInUsePermission:
          'Allow AuricRx Medcoach to access your location while using the app.',
        // Only include the next line if you truly need background location:
        // locationAlwaysAndWhenInUsePermission:
        //   'Allow AuricRx Medcoach to access your location in the background.',
      }],'expo-video',
      ],

    android: {
      package: 'com.auricrx.medcoach',
      minSdkVersion: 24,
      // Use full Android permission strings
      permissions: [
        'android.permission.CAMERA',
        'android.permission.READ_MEDIA_IMAGES', // gallery images on SDK 33+
        'android.permission.RECORD_AUDIO',
        // 'android.permission.POST_NOTIFICATIONS',
        // 'android.permission.ACCESS_FINE_LOCATION',
        // 'android.permission.ACCESS_COARSE_LOCATION',
      ],
    },

    ios: {
      infoPlist: {
        NSCameraUsageDescription: 'We use the camera to scan documents.',
        NSPhotoLibraryAddUsageDescription: 'We save scanned PDFs to your library.',
        // Add if needed:
        // NSMicrophoneUsageDescription: 'Microphone is used to record audio.',
        // NSLocationWhenInUseUsageDescription: 'Location is used to ...',
      },
    },

    // Anything you expose to the app at runtime should use EXPO_PUBLIC_*
    // Avoid shipping real secrets (like OpenAI keys) in the client.
    extra: {
      EXPO_PUBLIC_API_MODEL: process.env.EXPO_PUBLIC_API_MODEL ?? 'gpt-4o-mini',
      EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN ?? null,
      // If you truly must read the key on-device (not recommended), use:
      // EXPO_PUBLIC_OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? ''
      eas: { projectId: 'db976ea9-7756-4bdb-ba4e-7563b0d3597b' },
    },
  });
