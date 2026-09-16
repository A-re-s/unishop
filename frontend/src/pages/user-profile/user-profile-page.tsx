import { Navigate, useParams } from "react-router-dom";
import { useGetListingsQuery } from "@/entities/listing/api/listing-api";
import { useGetMeQuery, useGetUserQuery } from "@/entities/user/api/user-api";
import { formatTelegramHandle } from "@/entities/user/model/format-telegram-handle";
import { ListingFeed } from "@/widgets/listing-feed/listing-feed";
import styles from "./user-profile-page.module.css";

export function UserProfilePage() {
	const { userId = "" } = useParams();
	const { data: me } = useGetMeQuery();
	const {
		data: user,
		isLoading,
		isError,
	} = useGetUserQuery(userId, { skip: !userId });

	if (me && me.id === userId) {
		return <Navigate to="/profile" replace />;
	}

	if (isLoading) {
		return <p>Загрузка...</p>;
	}

	if (isError || !user) {
		return <p>Пользователь не найден.</p>;
	}

	return (
		<div>
			<h1>Профиль пользователя</h1>

			<div className={styles.card}>
				{user.avatar_url ? (
					<img
						className={styles.avatar}
						src={user.avatar_url}
						alt={user.username}
					/>
				) : (
					<div className={styles.avatarPlaceholder}>
						{user.username.slice(0, 1).toUpperCase()}
					</div>
				)}
				<div>
					<p className={styles.username}>{user.username}</p>
					{user.telegram_username ? (
						<a
							className={styles.telegramLink}
							href={`https://t.me/${formatTelegramHandle(user.telegram_username)}`}
							target="_blank"
							rel="noreferrer"
						>
							@{formatTelegramHandle(user.telegram_username)}
						</a>
					) : (
						<p className={styles.telegram}>Telegram не указан</p>
					)}
				</div>
			</div>

			<h2 className={styles.sectionTitle}>Объявления пользователя</h2>
			<ListingFeed
				useListingsQuery={useGetListingsQuery}
				fixedParams={{ author_id: user.id }}
				defaultStatus="active"
				emptyMessage="У пользователя пока нет активных объявлений."
			/>
		</div>
	);
}
