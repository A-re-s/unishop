import { ensureLocaleLoaded, i18n } from "@/shared/config/i18n";
import { detectLocale } from "../api/detect-locale";
import { getTextDirection, type Locale } from "../model/types";
import { getStoredLocale, setStoredLocale } from "./locale-storage";

export async function applyLocale(locale: Locale): Promise<void> {
	await ensureLocaleLoaded(locale);
	await i18n.changeLanguage(locale);
	document.documentElement.lang = locale;
	document.documentElement.dir = getTextDirection(locale);
}

export async function bootstrapLocale(): Promise<Locale> {
	const stored = getStoredLocale();
	if (stored) {
		await applyLocale(stored);
		return stored;
	}

	const detected = await detectLocale();
	setStoredLocale(detected);
	await applyLocale(detected);
	return detected;
}
