import * as LocalAuthentication from "expo-local-authentication";

export async function isAppLockAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

export async function unlockOrThrow(): Promise<void> {
  const available = await isAppLockAvailable();
  if (!available) {
    throw new Error(
      "App lock unavailable: no biometrics/passcode configured on device.",
    );
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Unlock VaultOps",
    cancelLabel: "Cancel",
    disableDeviceFallback: false,
  });

  if (!result.success) {
    throw new Error("Unlock cancelled or failed.");
  }
}
