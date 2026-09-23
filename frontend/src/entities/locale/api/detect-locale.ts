import { env } from "@/shared/config/env";
import { DEFAULT_LOCALE, isSupportedLocale, type Locale } from "../model/types";

// A plain fetch, not RTK Query: this runs once at app bootstrap, before the
// store/Provider tree exists yet.
export async function detectLocale(): Promise<Locale> {
	try {
		const response = await fetch(`${env.apiUrl}/v1/locale/detect`, {
			credentials: "include",
		});
		if (!response.ok) {
			return DEFAULT_LOCALE;
		}
		const data: { locale?: string } = await response.json();
		return data.locale && isSupportedLocale(data.locale)
			? data.locale
			: DEFAULT_LOCALE;
	} catch {
		// Backend unreachable — don't block the app on it.
		return DEFAULT_LOCALE;
	}
}
