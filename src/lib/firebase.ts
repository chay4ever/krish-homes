import type { FirebaseApp } from "firebase/app";
import type { Auth, ConfirmationResult, RecaptchaVerifier, User } from "firebase/auth";

export interface FirebaseWebConfig { apiKey: string; authDomain: string; projectId: string; appId?: string }

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let cfg: FirebaseWebConfig | null = null;
let authMod: typeof import("firebase/auth") | null = null;
let verifier: RecaptchaVerifier | null = null;
let confirmation: ConfirmationResult | null = null;

export async function initFirebase(config: FirebaseWebConfig | null) {
  if (!config || auth) return auth;
  cfg = config;
  const [{ initializeApp }, a] = await Promise.all([import("firebase/app"), import("firebase/auth")]);
  authMod = a;
  app = initializeApp(cfg);
  auth = a.getAuth(app);
  return auth;
}

export const firebaseReady = () => !!auth;

export async function onFirebaseUser(cb: (u: User | null) => void) {
  if (!auth || !authMod) { cb(null); return () => {}; }
  return authMod.onAuthStateChanged(auth, cb);
}

export async function getIdToken(): Promise<string | null> {
  if (!auth?.currentUser) return null;
  try { return await auth.currentUser.getIdToken(); } catch { return null; }
}

export function friendlyAuthError(e: any): string {
  const code = String(e?.code ?? "");
  const map: Record<string, string> = {
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/user-not-found": "No account found with this email.",
    "auth/email-already-in-use": "An account with this email already exists. Try signing in.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/too-many-requests": "Too many attempts. Please wait a bit and try again.",
    "auth/popup-closed-by-user": "Sign-in was cancelled.",
    "auth/cancelled-popup-request": "Sign-in was cancelled.",
    "auth/invalid-phone-number": "Enter a valid phone number with country code.",
    "auth/invalid-verification-code": "That code is incorrect.",
    "auth/code-expired": "That code has expired. Request a new one.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/operation-not-allowed": "This sign-in method isn't enabled yet. Enable it in the Firebase console.",
    "auth/unauthorized-domain": "This domain isn't authorised in Firebase. Add it under Authentication → Settings → Authorized domains.",
  };
  return map[code] ?? e?.message ?? "Something went wrong. Please try again.";
}

export async function signInGoogle() {
  if (!auth || !authMod) throw new Error("Sign-in isn't configured yet");
  const provider = new authMod.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await authMod.signInWithPopup(auth, provider);
}
export async function signInEmail(email: string, password: string) {
  if (!auth || !authMod) throw new Error("Sign-in isn't configured yet");
  await authMod.signInWithEmailAndPassword(auth, email, password);
}
export async function signUpEmail(name: string, email: string, password: string) {
  if (!auth || !authMod) throw new Error("Sign-in isn't configured yet");
  const cred = await authMod.createUserWithEmailAndPassword(auth, email, password);
  if (name) await authMod.updateProfile(cred.user, { displayName: name });
}
export async function resetPassword(email: string) {
  if (!auth || !authMod) throw new Error("Sign-in isn't configured yet");
  await authMod.sendPasswordResetEmail(auth, email);
}
export async function sendPhoneOtp(phone: string, containerId: string) {
  if (!auth || !authMod) throw new Error("Sign-in isn't configured yet");
  verifier?.clear();
  verifier = new authMod.RecaptchaVerifier(auth, containerId, { size: "invisible" });
  confirmation = await authMod.signInWithPhoneNumber(auth, phone, verifier);
}
export async function confirmPhoneOtp(code: string) {
  if (!confirmation) throw new Error("Request a code first");
  await confirmation.confirm(code);
}
export async function firebaseSignOut() {
  if (auth && authMod) await authMod.signOut(auth);
}
