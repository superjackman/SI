/* clipboard where allowed, else select the text field and execCommand('copy'), else leave it selected */
import { toast } from '../nav';
export async function copyText(inp: HTMLInputElement | null | undefined, ok: string, manual: string): Promise<boolean> {
  const v = inp?.value ?? '';
  try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(v); toast(ok); return true; } } catch { /* fall through */ }
  let done = false;
  if (inp) { inp.focus(); inp.select(); inp.setSelectionRange(0, v.length); try { done = document.execCommand('copy'); } catch { done = false; } }
  toast(done ? ok : manual);
  return done;
}
/** R20 named event for analytics (main.tsx: si-ev → evt-<name>; nothing is sent off the /SI/ build) */
export const ev = (name: string) => { dispatchEvent(new CustomEvent('si-ev', { detail: name })); };
