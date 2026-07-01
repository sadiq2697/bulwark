export function installChromeMock() {
  const sync = {}, local = {};
  const area = (store) => ({
    get: async (keys) => {
      if (keys == null) return { ...store };
      if (typeof keys === "string") return { [keys]: store[keys] };
      const out = {};
      for (const k of Object.keys(keys)) out[k] = k in store ? store[k] : keys[k];
      return out;
    },
    set: async (obj) => { Object.assign(store, obj); },
  });
  globalThis.chrome = { storage: { sync: area(sync), local: area(local) } };
  return { sync, local };
}
