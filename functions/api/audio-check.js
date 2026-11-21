import { checkPasscode } from './audio/[key].js';

// Lets the recording page check a passcode before showing its controls.
export async function onRequestGet(context) {
  const denied = await checkPasscode(context);
  if (denied) return denied;
  return Response.json({ ok: true });
}
