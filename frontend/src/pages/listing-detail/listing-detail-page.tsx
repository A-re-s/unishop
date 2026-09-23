import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useGetCategoriesQuery } from "@/entities/category/api/category-api";
import {
	useDeleteListingMutation,
	useGetListingQuery,
	useUpdateListingStatusMutation,
} from "@/entities/listing/api/listing-api";
import {
	useListingConditionLabels,
	useListingStatusLabels,
} from "@/entities/listing/lib/use-listing-labels";
import type { ListingStatus } from "@/entities/listing/model/types";
import { ALLOWED_STATUS_TRANSITIONS } from "@/entities/listing/model/types";
import { INTL_TAG, type Locale } from "@/entities/locale/model/types";
import { useGetMeQuery, useGetUserQuery } from "@/entities/user/api/user-api";
import { formatTelegramHandle } from "@/entities/user/model/format-telegram-handle";
import { useToast } from "@/shared/ui/toast/toast-provider";
import styles from "./listing-detail-page.module.css";

export function ListingDetailPage() {
	const { t, i18n } = useTranslation();
	const locale = i18n.resolvedLanguage as Locale;
	const { listingId = "" } = useParams();
	const navigate = useNavigate();
	const { showToast } = useToast();
	const [activePhoto, setActivePhoto] = useState(0);
	const listingConditionLabels = useListingConditionLabels();
	const listingStatusLabels = useListingStatusLabels();

	const priceFormatter = useMemo(
		() =>
			new Intl.NumberFormat(INTL_TAG[locale], {
				style: "currency",
				currency: "RUB",
				maximumFractionDigits: 0,
			}),
		[locale],
	);
	const dateFormatter = useMemo(
		() =>
			new Intl.DateTimeFormat(INTL_TAG[locale], {
				day: "numeric",
				month: "long",
				year: "numeric",
			}),
		[locale],
	);

	const { data: listing, isLoading } = useGetListingQuery(listingId, {
		skip: !listingId,
	});
	const { data: me } = useGetMeQuery();
	const { data: categories } = useGetCategoriesQuery();
	const { data: author } = useGetUserQuery(listing?.author_id ?? "", {
		skip: !listing,
	});
	const [deleteListing, { isLoading: isDeleting }] = useDeleteListingMutation();
	const [updateStatus, { isLoading: isChangingStatus }] =
		useUpdateListingStatusMutation();

	if (isLoading) {
		return <p>{t("common.loading")}</p>;
	}

	if (!listing) {
		return <p>{t("listingDetail.notFound")}</p>;
	}

	const isOwner = me?.id === listing.author_id;
	const categoryName = categories?.find(
		(category) => category.id === listing.category_id,
	)?.name;
	const photo = listing.photos[activePhoto];

	async function handleDelete() {
		if (!listing) {
			return;
		}
		if (!window.confirm(t("listingDetail.deleteConfirm"))) {
			return;
		}
		try {
			await deleteListing(listing.id).unwrap();
			showToast(t("listingDetail.deletedToast"));
			navigate("/");
		} catch {
			showToast(t("listingDetail.deleteErrorToast"), "error");
		}
	}

	async function handleStatusChange(status: ListingStatus) {
		if (!listing) {
			return;
		}
		try {
			await updateStatus({ id: listing.id, status }).unwrap();
			showToast(t("listingDetail.statusUpdatedToast"));
		} catch {
			showToast(t("listingDetail.statusErrorToast"), "error");
		}
	}

	return (
		<div className={styles.root}>
			<div className={styles.gallery}>
				{photo ? (
					<img
						className={styles.mainPhoto}
						src={photo.url}
						alt={listing.title}
					/>
				) : (
					<div className={styles.noPhoto}>{t("common.noPhoto")}</div>
				)}
				{listing.photos.length > 1 && (
					<div className={styles.thumbnails}>
						{listing.photos.map((item, index) => (
							<button
								key={item.id}
								type="button"
								className={
									index === activePhoto ? styles.thumbActive : styles.thumb
								}
								onClick={() => setActivePhoto(index)}
							>
								<img src={item.url} alt="" />
							</button>
						))}
					</div>
				)}
			</div>

			<div className={styles.info}>
				<span className={styles.statusBadge}>
					{listingStatusLabels[listing.status]}
				</span>
				<h1 className={styles.title}>{listing.title}</h1>
				<p className={styles.price}>
					{priceFormatter.format(Number(listing.price))}
				</p>

				<dl className={styles.meta}>
					<div>
						<dt>{t("listingDetail.category")}</dt>
						<dd>{categoryName ?? "—"}</dd>
					</div>
					<div>
						<dt>{t("listingDetail.condition")}</dt>
						<dd>{listingConditionLabels[listing.condition]}</dd>
					</div>
					<div>
						<dt>{t("listingDetail.createdAt")}</dt>
						<dd>{dateFormatter.format(new Date(listing.created_at))}</dd>
					</div>
				</dl>

				<p className={styles.description}>{listing.description}</p>

				<div className={styles.author}>
					<p className={styles.authorLabel}>{t("listingDetail.seller")}</p>
					<Link
						to={`/users/${listing.author_id}`}
						className={styles.authorName}
					>
						{author?.username ?? "…"}
					</Link>
					{author?.telegram_username && (
						<a
							className={styles.telegramLink}
							href={`https://t.me/${formatTelegramHandle(author.telegram_username)}`}
							target="_blank"
							rel="noreferrer"
						>
							@{formatTelegramHandle(author.telegram_username)}
						</a>
					)}
				</div>

				{isOwner && (
					<div className={styles.ownerActions}>
						<div className={styles.ownerButtons}>
							<Link
								to={`/listings/${listing.id}/edit`}
								className={styles.editButton}
							>
								{t("common.edit")}
							</Link>
							<button
								type="button"
								className={styles.deleteButton}
								onClick={handleDelete}
								disabled={isDeleting}
							>
								{t("common.delete")}
							</button>
						</div>
						{ALLOWED_STATUS_TRANSITIONS[listing.status].length > 0 && (
							<div className={styles.statusActions}>
								<span>{t("listingDetail.changeStatus")}</span>
								{ALLOWED_STATUS_TRANSITIONS[listing.status].map((status) => (
									<button
										key={status}
										type="button"
										className={styles.statusButton}
										onClick={() => handleStatusChange(status)}
										disabled={isChangingStatus}
									>
										{listingStatusLabels[status]}
									</button>
								))}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
