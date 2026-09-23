import { isSupportedLocale, type Locale } from "../model/types";

// Deliberately namespaced — a bare "locale" key is too easy to collide with
// something else someone adds to localStorage later.
const LOCALE_STORAGE_KEY = "unishop:locale";

export function getStoredLocale(): Locale | null {
	try {
		const value = localStorage.getItem(LOCALE_STORAGE_KEY);
		return value && isSupportedLocale(value) ? value : null;
	} catch {
		// Private browsing / disabled storage — treat as "nothing stored".
		return null;
	}
}

export function setStoredLocale(locale: Locale): void {
	try {
		localStorage.setItem(LOCALE_STORAGE_KEY, locale);
	} catch {
		// Ignore — worst case the choice doesn't persist across reloads.
	}
}
