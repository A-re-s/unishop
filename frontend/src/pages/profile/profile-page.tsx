import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetListingsQuery } from "@/entities/listing/api/listing-api";
import {
	useDeleteAvatarMutation,
	useGetMeQuery,
	useUpdateMeMutation,
	useUploadAvatarMutation,
} from "@/entities/user/api/user-api";
import { formatTelegramHandle } from "@/entities/user/model/format-telegram-handle";
import { LogoutButton } from "@/features/auth/ui/logout-button";
import { LanguageSwitcher } from "@/features/locale/ui/language-switcher";
import { useToast } from "@/shared/ui/toast/toast-provider";
import { ListingFeed } from "@/widgets/listing-feed/listing-feed";
import styles from "./profile-page.module.css";

export function ProfilePage() {
	const { t } = useTranslation();
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
			showToast(t("profilePage.updatedToast"));
			setIsEditing(false);
		} catch {
			showToast(t("profilePage.updateErrorToast"), "error");
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
			showToast(t("profilePage.avatarUpdatedToast"));
		} catch {
			showToast(t("profilePage.avatarErrorToast"), "error");
		}
	}

	async function handleAvatarDelete() {
		try {
			await deleteAvatar().unwrap();
			showToast(t("profilePage.avatarRemovedToast"));
		} catch {
			showToast(t("profilePage.avatarRemoveErrorToast"), "error");
		}
	}

	if (!user) {
		return <p>{t("common.loading")}</p>;
	}

	return (
		<div>
			<div className={styles.header}>
				<h1>{t("profilePage.title")}</h1>
				<LogoutButton />
			</div>

			<div className={styles.settingsRow}>
				<span className={styles.settingsLabel}>
					{t("profilePage.language")}
				</span>
				<LanguageSwitcher />
			</div>

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
							{isUploadingAvatar
								? t("profilePage.uploading")
								: t("profilePage.changePhoto")}
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
								{t("profilePage.removePhoto")}
							</button>
						)}
					</div>
				</div>

				{isEditing ? (
					<form className={styles.editForm} onSubmit={handleSave}>
						<label className={styles.field}>
							<span>{t("profilePage.usernameLabel")}</span>
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
							<span>{t("profilePage.telegramLabel")}</span>
							<input
								type="text"
								value={telegramUsername}
								onChange={(event) => setTelegramUsername(event.target.value)}
								placeholder="username"
							/>
						</label>
						<div className={styles.editActions}>
							<button type="submit" disabled={isSaving}>
								{t("common.save")}
							</button>
							<button type="button" onClick={() => setIsEditing(false)}>
								{t("common.cancel")}
							</button>
						</div>
					</form>
				) : (
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
							<p className={styles.telegram}>
								{t("profilePage.telegramNotSet")}
							</p>
						)}
						<button
							type="button"
							className={styles.editButton}
							onClick={startEditing}
						>
							{t("profilePage.editProfile")}
						</button>
					</div>
				)}
			</div>

			<h2 className={styles.sectionTitle}>{t("profilePage.myListings")}</h2>
			<ListingFeed
				useListingsQuery={useGetListingsQuery}
				fixedParams={{ author_id: user.id }}
				emptyMessage={t("profilePage.myListingsEmpty")}
			/>
		</div>
	);
}
