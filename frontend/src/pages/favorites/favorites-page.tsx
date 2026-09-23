import { useTranslation } from "react-i18next";
import { useGetFavoritesQuery } from "@/entities/listing/api/listing-api";
import { ListingFeed } from "@/widgets/listing-feed/listing-feed";

export function FavoritesPage() {
	const { t } = useTranslation();

	return (
		<div>
			<h1>{t("favoritesPage.title")}</h1>
			<ListingFeed
				useListingsQuery={useGetFavoritesQuery}
				emptyMessage={t("favoritesPage.empty")}
			/>
		</div>
	);
}
