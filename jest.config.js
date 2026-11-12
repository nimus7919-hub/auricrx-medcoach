module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/backup_.*/',
    '/auric-rx/',
    '/scripts/',
    '/server/',
  ],
  testMatch: [
    '**/src/services/__tests__/**/*.test.{ts,tsx,js,jsx}',
    '**/src/lib/__tests__/**/*.test.{ts,tsx,js,jsx}',
    '**/src/utils/__tests__/**/*.test.{ts,tsx,js,jsx}',
    '**/src/region/__tests__/**/*.test.{ts,tsx,js,jsx}',
    '**/src/components/__tests__/**/*.test.{js,jsx,ts,tsx}',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  moduleNameMapper: {
    '^../i18n$': '<rootDir>/jest.mocks.js',
  },
};
