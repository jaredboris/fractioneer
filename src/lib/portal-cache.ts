// Lightweight per-key in-memory caches so portal tabs can show their
// last-known data instantly on re-mount while the background refresh runs.
// Survives client-side navigations (module stays alive); cleared on full
// reload, sign-out, or impersonation toggle.

const stores = new Map<string, Map<string, unknown>>();

function bucket(name: string): Map<string, unknown> {
  let b = stores.get(name);
  if (!b) {
    b = new Map();
    stores.set(name, b);
  }
  return b;
}

export function getCached<T>(name: string, key: string): T | undefined {
  return bucket(name).get(key) as T | undefined;
}

export function setCached<T>(name: string, key: string, value: T): void {
  bucket(name).set(key, value);
}

export function clearAllCaches(): void {
  stores.clear();
}
