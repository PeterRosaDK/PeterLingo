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
  const mac = !ios && /Macintosh|Mac OS X/.test(userAgent);
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
  else if (!webBluetooth)
    guidance = mac
      ? 'Beacio er kun til iPhone/iPad. Åbn PeterLingo i en aktuel Chrome eller Edge på Mac.'
      : 'Brug en aktuel Chrome eller Edge med Web Bluetooth.';
  else if (mac)
    guidance = 'Beacio er ikke nødvendig på Mac. Chrome eller Edge bruger Web Bluetooth direkte.';
  return {
    platform,
    browser,
    secureContext: window.isSecureContext,
    webBluetooth,
    beacio,
    guidance,
  };
}
