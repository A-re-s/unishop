import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
	useFavoriteListingMutation,
	useUnfavoriteListingMutation,
} from "@/entities/listing/api/listing-api";
import { useListingStatusLabels } from "@/entities/listing/lib/use-listing-labels";
import type { Listing } from "@/entities/listing/model/types";
import { INTL_TAG, type Locale } from "@/entities/locale/model/types";
import { useToast } from "@/shared/ui/toast/toast-provider";
import styles from "./listing-card.module.css";

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
	const { t, i18n } = useTranslation();
	const locale = i18n.resolvedLanguage as Locale;
	const listingStatusLabels = useListingStatusLabels();
	const [favorite, { isLoading: isFavoriting }] = useFavoriteListingMutation();
	const [unfavorite, { isLoading: isUnfavoriting }] =
		useUnfavoriteListingMutation();
	const { showToast } = useToast();

	const priceFormatter = useMemo(
		() =>
			new Intl.NumberFormat(INTL_TAG[locale], {
				style: "currency",
				currency: "RUB",
				maximumFractionDigits: 0,
			}),
		[locale],
	);

	const handleToggleFavorite = async (event: React.MouseEvent) => {
		event.preventDefault();
		try {
			if (listing.is_favorite) {
				await unfavorite(listing.id).unwrap();
			} else {
				await favorite(listing.id).unwrap();
			}
		} catch {
			showToast(t("listingCard.updateFavoriteError"), "error");
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
					<div className={styles.imagePlaceholder}>{t("common.noPhoto")}</div>
				)}
				{listing.status !== "active" && (
					<span className={styles.statusBadge}>
						{listingStatusLabels[listing.status]}
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
								? t("listingCard.removeFavorite")
								: t("listingCard.addFavorite")
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
