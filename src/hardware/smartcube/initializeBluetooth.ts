import '@beacio/core/auto';

// Any module that checks Bluetooth imports this marker first. The side-effect import
// above installs Beacio's Safari bridge (or no-ops on native Web Bluetooth) before
// capability detection runs.
export const bluetoothInitializationComplete = true;
