import { useState } from "react";
import { useGetListingsQuery } from "@/entities/listing/api/listing-api";
import {
	useDeleteAvatarMutation,
	useGetMeQuery,
	useUpdateMeMutation,
	useUploadAvatarMutation,
} from "@/entities/user/api/user-api";
import { formatTelegramHandle } from "@/entities/user/model/format-telegram-handle";
import { LogoutButton } from "@/features/auth/ui/logout-button";
import { useToast } from "@/shared/ui/toast/toast-provider";
import { ListingFeed } from "@/widgets/listing-feed/listing-feed";
import styles from "./profile-page.module.css";

export function ProfilePage() {
	const { data: user } = useGetMeQuery();
	const { showToast } = useToast();

	const [updateMe, { isLoading: isSaving }] = useUpdateMeMutation();
	const [uploadAvatar, { isLoading: isUploadingAvatar }] =
		useUploadAvatarMutation();
	const [deleteAvatar, { isLoading: isDeletingAvatar }] =
		useDeleteAvatarMutation();

	const [isEditing, setIsEditing] = useState(false);
	const [username, setUsername] = useState(user?.username ?? "");
	const [telegramUsername, setTelegramUsername] = useState(
		user?.telegram_username ?? "",
	);

	function startEditing() {
		if (!user) {
			return;
		}
		setUsername(user.username);
		setTelegramUsername(user.telegram_username ?? "");
		setIsEditing(true);
	}

	async function handleSave(event: React.FormEvent) {
		event.preventDefault();
		try {
			await updateMe({
				username: username.trim(),
				telegram_username: formatTelegramHandle(telegramUsername),
			}).unwrap();
			showToast("Профиль обновлён");
			setIsEditing(false);
		} catch {
			showToast("Не удалось сохранить профиль", "error");
		}
	}

	async function handleAvatarChange(
		event: React.ChangeEvent<HTMLInputElement>,
	) {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) {
			return;
		}
		try {
			await uploadAvatar(file).unwrap();
			showToast("Фото профиля обновлено");
		} catch {
			showToast("Не удалось загрузить фото", "error");
		}
	}

	async function handleAvatarDelete() {
		try {
			await deleteAvatar().unwrap();
			showToast("Фото профиля удалено");
		} catch {
			showToast("Не удалось удалить фото", "error");
		}
	}

	if (!user) {
		return <p>Загрузка...</p>;
	}

	return (
		<div>
			<h1>Профиль</h1>

			<div className={styles.card}>
				<div className={styles.avatarWrapper}>
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
					<div className={styles.avatarActions}>
						<label className={styles.avatarButton}>
							{isUploadingAvatar ? "Загрузка..." : "Изменить фото"}
							<input
								type="file"
								accept="image/*"
								hidden
								disabled={isUploadingAvatar}
								onChange={handleAvatarChange}
							/>
						</label>
						{user.avatar_url && (
							<button
								type="button"
								className={styles.avatarRemoveButton}
								onClick={handleAvatarDelete}
								disabled={isDeletingAvatar}
							>
								Удалить фото
							</button>
						)}
					</div>
				</div>

				{isEditing ? (
					<form className={styles.editForm} onSubmit={handleSave}>
						<label className={styles.field}>
							<span>Имя пользователя</span>
							<input
								type="text"
								value={username}
								onChange={(event) => setUsername(event.target.value)}
								required
								minLength={1}
								maxLength={255}
							/>
						</label>
						<label className={styles.field}>
							<span>Telegram</span>
							<input
								type="text"
								value={telegramUsername}
								onChange={(event) => setTelegramUsername(event.target.value)}
								placeholder="username"
							/>
						</label>
						<div className={styles.editActions}>
							<button type="submit" disabled={isSaving}>
								Сохранить
							</button>
							<button type="button" onClick={() => setIsEditing(false)}>
								Отмена
							</button>
						</div>
					</form>
				) : (
					<div>
						<p className={styles.username}>{user.username}</p>
						<p className={styles.telegram}>
							{user.telegram_username
								? `@${formatTelegramHandle(user.telegram_username)}`
								: "Telegram не указан"}
						</p>
						<button
							type="button"
							className={styles.editButton}
							onClick={startEditing}
						>
							Редактировать профиль
						</button>
					</div>
				)}
			</div>

			<h2 className={styles.sectionTitle}>Мои объявления</h2>
			<ListingFeed
				useListingsQuery={useGetListingsQuery}
				fixedParams={{ author_id: user.id }}
				emptyMessage="У вас пока нет объявлений."
			/>

			<div className={styles.logout}>
				<LogoutButton />
			</div>
		</div>
	);
}
