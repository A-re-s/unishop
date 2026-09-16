import { env } from "@/shared/config/env";
import styles from "./logout-button.module.css";

// A plain link, not a fetch/mutation: the backend needs to redirect the
// browser through Keycloak's own end-session endpoint so its SSO cookie is
// cleared too, not just our app's session — same reasoning as LoginButton.
export function LogoutButton() {
	return (
		<a className={styles.button} href={`${env.apiUrl}/v1/auth/logout`}>
			Выйти
		</a>
	);
}
