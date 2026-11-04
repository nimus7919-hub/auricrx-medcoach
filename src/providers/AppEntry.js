import '../services/privacyLogging';
import React from 'react';
import AppController from './AppController';
import { RegionProvider } from './RegionProvider';
export default function AppEntry() {
  return <RegionProvider><AppController /></RegionProvider>;
}
