import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useGetCategoriesQuery } from "@/entities/category/api/category-api";
import {
	useDeleteListingMutation,
	useGetListingQuery,
	useUpdateListingStatusMutation,
} from "@/entities/listing/api/listing-api";
import type { ListingStatus } from "@/entities/listing/model/types";
import {
	ALLOWED_STATUS_TRANSITIONS,
	LISTING_CONDITION_LABELS,
	LISTING_STATUS_LABELS,
} from "@/entities/listing/model/types";
import { useGetMeQuery, useGetUserQuery } from "@/entities/user/api/user-api";
import styles from "./listing-detail-page.module.css";

const priceFormatter = new Intl.NumberFormat("ru-RU", {
	style: "currency",
	currency: "RUB",
	maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
	day: "numeric",
	month: "long",
	year: "numeric",
});

export function ListingDetailPage() {
	const { listingId = "" } = useParams();
	const navigate = useNavigate();
	const [activePhoto, setActivePhoto] = useState(0);

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
		return <p>Загрузка...</p>;
	}

	if (!listing) {
		return <p>Объявление не найдено.</p>;
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
		if (!window.confirm("Удалить объявление? Это действие необратимо.")) {
			return;
		}
		await deleteListing(listing.id).unwrap();
		navigate("/");
	}

	async function handleStatusChange(status: ListingStatus) {
		if (!listing) {
			return;
		}
		await updateStatus({ id: listing.id, status }).unwrap();
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
					<div className={styles.noPhoto}>Нет фото</div>
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
					{LISTING_STATUS_LABELS[listing.status]}
				</span>
				<h1 className={styles.title}>{listing.title}</h1>
				<p className={styles.price}>
					{priceFormatter.format(Number(listing.price))}
				</p>

				<dl className={styles.meta}>
					<div>
						<dt>Категория</dt>
						<dd>{categoryName ?? "—"}</dd>
					</div>
					<div>
						<dt>Состояние</dt>
						<dd>{LISTING_CONDITION_LABELS[listing.condition]}</dd>
					</div>
					<div>
						<dt>Дата размещения</dt>
						<dd>{dateFormatter.format(new Date(listing.created_at))}</dd>
					</div>
				</dl>

				<p className={styles.description}>{listing.description}</p>

				<div className={styles.author}>
					<p className={styles.authorLabel}>Продавец</p>
					<p className={styles.authorName}>{author?.username ?? "…"}</p>
					{author?.telegram_username && (
						<a
							className={styles.telegramLink}
							href={`https://t.me/${author.telegram_username}`}
							target="_blank"
							rel="noreferrer"
						>
							@{author.telegram_username}
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
								Редактировать
							</Link>
							<button
								type="button"
								className={styles.deleteButton}
								onClick={handleDelete}
								disabled={isDeleting}
							>
								Удалить
							</button>
						</div>
						{ALLOWED_STATUS_TRANSITIONS[listing.status].length > 0 && (
							<div className={styles.statusActions}>
								<span>Сменить статус:</span>
								{ALLOWED_STATUS_TRANSITIONS[listing.status].map((status) => (
									<button
										key={status}
										type="button"
										className={styles.statusButton}
										onClick={() => handleStatusChange(status)}
										disabled={isChangingStatus}
									>
										{LISTING_STATUS_LABELS[status]}
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
