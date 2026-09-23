import { useTranslation } from "react-i18next";
import { LoginButton } from "@/features/auth/ui/login-button";
import styles from "./login-page.module.css";

export function LoginPage() {
	const { t } = useTranslation();

	return (
		<div className={styles.root}>
			<h1>{t("loginPage.title")}</h1>
			<p>{t("loginPage.subtitle")}</p>
			<LoginButton />
		</div>
	);
}
