import { ConfirmationResult } from 'firebase/auth';

// Store confirmation result between PhoneAuthScreen and OTPVerifyScreen
// Can't be passed through navigation params as it's not serializable
let _confirmation: ConfirmationResult | null = null;

export const setConfirmation = (c: ConfirmationResult) => { _confirmation = c; };
export const getConfirmation = () => _confirmation;
export const clearConfirmation = () => { _confirmation = null; };
