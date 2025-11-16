const KEY = 'psd-sim-state-v1';

export function saveState(data) {
  try {
    const payload = {
      v: 1,
      savedAt: Date.now(),
      data
    };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch (e) {
    // ignore quota or privacy errors
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== 1) return null;
    return parsed.data;
  } catch (e) {
    return null;
  }
}

export function clearState() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    // ignore
  }
}