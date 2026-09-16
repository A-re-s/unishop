import { LoginButton } from "@/features/auth/ui/login-button";
import styles from "./login-page.module.css";

export function LoginPage() {
	return (
		<div className={styles.root}>
			<h1>Unishop</h1>
			<p>Доска объявлений университета</p>
			<LoginButton />
		</div>
	);
}
