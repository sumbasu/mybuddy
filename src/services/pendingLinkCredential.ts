import { AuthCredential } from 'firebase/auth';

// When Google/Apple sign-in collides with an existing (verified-email)
// phone account, Firebase refuses to silently create a second account and
// hands back the OAuth credential instead — safe to apply with
// linkWithCredential, but only once the user re-proves ownership of the
// original phone account via OTP, which happens on a different screen.
// AuthCredential isn't serializable, so — same as phoneAuth.ts's
// ConfirmationResult — it's stashed here in memory rather than passed
// through navigation params.
let pendingLinkCredential: AuthCredential | null = null;

export function setPendingLinkCredential(credential: AuthCredential) {
  pendingLinkCredential = credential;
}

export function getPendingLinkCredential(): AuthCredential | null {
  return pendingLinkCredential;
}

export function clearPendingLinkCredential() {
  pendingLinkCredential = null;
}
