import { ConfirmationResult } from 'firebase/auth';

// Firebase's phone-auth ConfirmationResult isn't serializable, so it can't
// travel through React Navigation params — PhoneNumberScreen stashes it here
// and OTPVerifyScreen reads it back to confirm the SMS code.
let pendingConfirmation: ConfirmationResult | null = null;

export function setPendingConfirmation(result: ConfirmationResult) {
  pendingConfirmation = result;
}

export function getPendingConfirmation(): ConfirmationResult | null {
  return pendingConfirmation;
}

export function clearPendingConfirmation() {
  pendingConfirmation = null;
}
