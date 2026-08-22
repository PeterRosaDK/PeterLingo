import { detectPlatform } from '@beacio/core';

export interface BluetoothEnvironment {
  platform: string;
  browser: string;
  secureContext: boolean;
  webBluetooth: boolean;
  beacio: 'active' | 'missing-or-disabled' | 'not-needed';
  guidance: string;
}

export function detectBluetoothEnvironment(userAgent = navigator.userAgent): BluetoothEnvironment {
  const ios =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1);
  const webBluetooth = 'bluetooth' in navigator;
  const platform = detectPlatform();
  const browser = ios
    ? 'Safari på iOS/iPadOS'
    : /Edg\//.test(userAgent)
      ? 'Microsoft Edge'
      : /Chrome\//.test(userAgent)
        ? 'Google Chrome'
        : 'Anden browser';
  const beacio = ios ? (webBluetooth ? 'active' : 'missing-or-disabled') : 'not-needed';
  let guidance = 'Tryk Forbind først, når terningen er vågen og tæt på enheden.';
  if (!window.isSecureContext) guidance = 'Bluetooth kræver HTTPS eller localhost.';
  else if (ios && !webBluetooth)
    guidance =
      'Installér Beacio, aktivér Safari-udvidelsen under Indstillinger → Apps → Safari → Udvidelser, og genindlæs siden.';
  else if (!webBluetooth) guidance = 'Brug en aktuel Chrome eller Edge med Web Bluetooth.';
  return {
    platform,
    browser,
    secureContext: window.isSecureContext,
    webBluetooth,
    beacio,
    guidance,
  };
}
