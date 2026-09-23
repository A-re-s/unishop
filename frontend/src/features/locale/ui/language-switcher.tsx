import { useTranslation } from "react-i18next";
import { applyLocale } from "@/entities/locale/lib/bootstrap-locale";
import { setStoredLocale } from "@/entities/locale/lib/locale-storage";
import {
	isSupportedLocale,
	LOCALE_LABELS,
	type Locale,
	SUPPORTED_LOCALES,
} from "@/entities/locale/model/types";
import styles from "./language-switcher.module.css";

export function LanguageSwitcher() {
	const { i18n } = useTranslation();
	const current = i18n.resolvedLanguage as Locale;

	function handleChange(value: string) {
		if (!isSupportedLocale(value) || value === current) {
			return;
		}
		setStoredLocale(value);
		applyLocale(value);
	}

	return (
		<select
			className={styles.select}
			value={current}
			onChange={(event) => handleChange(event.target.value)}
			aria-label="Language"
		>
			{SUPPORTED_LOCALES.map((locale) => (
				<option key={locale} value={locale}>
					{LOCALE_LABELS[locale]}
				</option>
			))}
		</select>
	);
}
