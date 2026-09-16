import { Link } from "react-router-dom";
import {
	useFavoriteListingMutation,
	useUnfavoriteListingMutation,
} from "@/entities/listing/api/listing-api";
import type { Listing } from "@/entities/listing/model/types";
import { LISTING_STATUS_LABELS } from "@/entities/listing/model/types";
import { useToast } from "@/shared/ui/toast/toast-provider";
import styles from "./listing-card.module.css";

const priceFormatter = new Intl.NumberFormat("ru-RU", {
	style: "currency",
	currency: "RUB",
	maximumFractionDigits: 0,
});

interface ListingCardProps {
	listing: Listing;
	categoryName?: string;
	isOwn: boolean;
}

export function ListingCard({
	listing,
	categoryName,
	isOwn,
}: ListingCardProps) {
	const [favorite, { isLoading: isFavoriting }] = useFavoriteListingMutation();
	const [unfavorite, { isLoading: isUnfavoriting }] =
		useUnfavoriteListingMutation();
	const { showToast } = useToast();

	const handleToggleFavorite = async (event: React.MouseEvent) => {
		event.preventDefault();
		try {
			if (listing.is_favorite) {
				await unfavorite(listing.id).unwrap();
			} else {
				await favorite(listing.id).unwrap();
			}
		} catch {
			showToast("Не удалось обновить избранное", "error");
		}
	};

	return (
		<Link to={`/listings/${listing.id}`} className={styles.card}>
			<div className={styles.imageWrapper}>
				{listing.photos[0] ? (
					<img
						className={styles.image}
						src={listing.photos[0].url}
						alt={listing.title}
					/>
				) : (
					<div className={styles.imagePlaceholder}>Нет фото</div>
				)}
				{listing.status !== "active" && (
					<span className={styles.statusBadge}>
						{LISTING_STATUS_LABELS[listing.status]}
					</span>
				)}
				{!isOwn && (
					<button
						type="button"
						className={styles.favoriteButton}
						onClick={handleToggleFavorite}
						disabled={isFavoriting || isUnfavoriting}
						aria-label={
							listing.is_favorite
								? "Убрать из избранного"
								: "Добавить в избранное"
						}
					>
						{listing.is_favorite ? "♥" : "♡"}
					</button>
				)}
			</div>
			<div className={styles.body}>
				<p className={styles.price}>
					{priceFormatter.format(Number(listing.price))}
				</p>
				<p className={styles.title}>{listing.title}</p>
				{categoryName && <p className={styles.category}>{categoryName}</p>}
			</div>
		</Link>
	);
}
