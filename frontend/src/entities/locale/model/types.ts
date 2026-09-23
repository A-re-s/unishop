// The world's most-spoken languages (native + second-language speakers
// combined), English first since it's this app's default.
export type Locale =
	| "en"
	| "ru"
	| "zh"
	| "hi"
	| "es"
	| "fr"
	| "ar"
	| "bn"
	| "pt"
	| "ur"
	| "id"
	| "de"
	| "ja";

export const SUPPORTED_LOCALES: Locale[] = [
	"en",
	"ru",
	"zh",
	"hi",
	"es",
	"fr",
	"ar",
	"bn",
	"pt",
	"ur",
	"id",
	"de",
	"ja",
];
export const DEFAULT_LOCALE: Locale = "en";

export function isSupportedLocale(value: string): value is Locale {
	return (SUPPORTED_LOCALES as string[]).includes(value);
}

// BCP-47 tags for Intl.* formatters (dates, currency) — not the same thing
// as the i18next locale key, just happens to line up closely.
export const INTL_TAG: Record<Locale, string> = {
	en: "en-US",
	ru: "ru-RU",
	zh: "zh-CN",
	hi: "hi-IN",
	es: "es-ES",
	fr: "fr-FR",
	ar: "ar-SA",
	bn: "bn-BD",
	pt: "pt-PT",
	ur: "ur-PK",
	id: "id-ID",
	de: "de-DE",
	ja: "ja-JP",
};

// Language names shown by the switcher, always in their own language —
// the standard convention (a reader who doesn't know the current UI
// language still needs to recognize their own).
export const LOCALE_LABELS: Record<Locale, string> = {
	en: "English",
	ru: "Русский",
	zh: "中文",
	hi: "हिन्दी",
	es: "Español",
	fr: "Français",
	ar: "العربية",
	bn: "বাংলা",
	pt: "Português",
	ur: "اردو",
	id: "Bahasa Indonesia",
	de: "Deutsch",
	ja: "日本語",
};

const RTL_LOCALES: ReadonlySet<Locale> = new Set(["ar", "ur"]);

export function getTextDirection(locale: Locale): "rtl" | "ltr" {
	return RTL_LOCALES.has(locale) ? "rtl" : "ltr";
}
