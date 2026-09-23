import { useTranslation } from "react-i18next";
import { env } from "@/shared/config/env";
import styles from "./login-button.module.css";

// A plain link, not a fetch/mutation: this has to be a real top-level
// navigation so the browser follows the redirect chain to Keycloak's own
// login page and back.
export function LoginButton() {
	const { t } = useTranslation();

	return (
		<a className={styles.button} href={`${env.apiUrl}/v1/auth/login`}>
			{t("auth.login")}
		</a>
	);
}
