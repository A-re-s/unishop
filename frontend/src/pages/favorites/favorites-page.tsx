import { useGetFavoritesQuery } from "@/entities/listing/api/listing-api";
import { ListingFeed } from "@/widgets/listing-feed/listing-feed";

export function FavoritesPage() {
	return (
		<div>
			<h1>Избранное</h1>
			<ListingFeed
				useListingsQuery={useGetFavoritesQuery}
				emptyMessage="Вы пока ничего не добавили в избранное."
			/>
		</div>
	);
}
