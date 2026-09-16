import { useGetListingsQuery } from "@/entities/listing/api/listing-api";
import { ListingFeed } from "@/widgets/listing-feed/listing-feed";

export function HomePage() {
	return (
		<div>
			<h1>Рекомендации</h1>
			<ListingFeed
				useListingsQuery={useGetListingsQuery}
				defaultStatus="active"
				emptyMessage="Пока нет активных объявлений."
			/>
		</div>
	);
}
