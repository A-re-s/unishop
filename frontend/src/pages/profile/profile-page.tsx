import { useGetMeQuery } from "@/entities/user/api/user-api";
import { LogoutButton } from "@/features/auth/ui/logout-button";
import styles from "./profile-page.module.css";

export function ProfilePage() {
	const { data: user } = useGetMeQuery();

	return (
		<div>
			<h1>Профиль</h1>
			{user && (
				<div className={styles.card}>
					{user.avatar_url && (
						<img
							className={styles.avatar}
							src={user.avatar_url}
							alt={user.username}
						/>
					)}
					<div>
						<p className={styles.username}>{user.username}</p>
						<p className={styles.telegram}>
							{user.telegram_username ?? "Telegram не указан"}
						</p>
					</div>
				</div>
			)}
			<p>Здесь появятся редактирование профиля и «Мои объявления».</p>
			<LogoutButton />
		</div>
	);
}
