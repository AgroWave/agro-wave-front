import esDict from "./es.json";

type NestedRecord = { [key: string]: string | NestedRecord };

/**
 * Translates a key by navigating the nested Spanish translation dictionary.
 * @param key - Period-delimited translation key (e.g. 'system.api_available').
 * @returns The translated string, or the key itself if not found.
 */
export function t(key: string): string {
  const parts = key.split(".");
  let current: unknown = esDict as NestedRecord;

  for (const part of parts) {
    if (typeof current === "object" && current !== null && part in current) {
      current = (current as NestedRecord)[part];
    } else {
      return key;
    }
  }

  return typeof current === "string" ? current : key;
}
