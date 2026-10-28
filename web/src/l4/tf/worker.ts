/* R38: the Transformer runs here, off the main thread */
import { handle, type Req } from './core';
const ctx = self as unknown as { postMessage(m: unknown): void; onmessage: ((e: MessageEvent<{ id: number; q: Req }>) => void) | null };
ctx.onmessage = (e) => { const { id, q } = e.data; let r: unknown; try { r = handle(q, (m) => ctx.postMessage({ ev: m })); } catch (err) { r = { error: String(err) }; } ctx.postMessage({ id, r }); };
