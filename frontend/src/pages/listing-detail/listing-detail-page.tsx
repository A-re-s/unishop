import { useParams } from "react-router-dom";

export function ListingDetailPage() {
	const { listingId } = useParams();

	return (
		<div>
			<h1>Объявление</h1>
			<p>Полная страница объявления {listingId} появится на следующем этапе.</p>
		</div>
	);
}
