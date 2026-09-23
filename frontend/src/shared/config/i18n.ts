import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LOCALE, type Locale } from "@/entities/locale/model/types";
import en from "@/shared/locales/en.json";

// Only the default locale ships in the main bundle (i18next needs it
// synchronously at init as the fallback). Every other language is its own
// chunk, fetched on demand — with 13 languages, eagerly bundling all of them
// would ship every visitor translations for 12 languages they'll never read.
const LOCALE_LOADERS: Record<Locale, () => Promise<{ default: object }>> = {
	en: () => Promise.resolve({ default: en }),
	ru: () => import("@/shared/locales/ru.json"),
	zh: () => import("@/shared/locales/zh.json"),
	hi: () => import("@/shared/locales/hi.json"),
	es: () => import("@/shared/locales/es.json"),
	fr: () => import("@/shared/locales/fr.json"),
	ar: () => import("@/shared/locales/ar.json"),
	bn: () => import("@/shared/locales/bn.json"),
	pt: () => import("@/shared/locales/pt.json"),
	ur: () => import("@/shared/locales/ur.json"),
	id: () => import("@/shared/locales/id.json"),
	de: () => import("@/shared/locales/de.json"),
	ja: () => import("@/shared/locales/ja.json"),
};

i18n.use(initReactI18next).init({
	resources: {
		en: { translation: en },
	},
	lng: DEFAULT_LOCALE,
	fallbackLng: DEFAULT_LOCALE,
	interpolation: { escapeValue: false },
	returnNull: false,
});

export async function ensureLocaleLoaded(locale: Locale): Promise<void> {
	if (i18n.hasResourceBundle(locale, "translation")) {
		return;
	}
	const { default: resource } = await LOCALE_LOADERS[locale]();
	i18n.addResourceBundle(locale, "translation", resource);
}

export { i18n };
