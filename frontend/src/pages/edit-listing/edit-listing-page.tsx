import { Navigate, useParams } from "react-router-dom";
import { useGetListingQuery } from "@/entities/listing/api/listing-api";
import { useGetMeQuery } from "@/entities/user/api/user-api";
import { ListingForm } from "@/widgets/listing-form/listing-form";

export function EditListingPage() {
	const { listingId = "" } = useParams();
	const { data: listing, isLoading } = useGetListingQuery(listingId, {
		skip: !listingId,
	});
	const { data: me } = useGetMeQuery();

	if (isLoading) {
		return <p>Загрузка...</p>;
	}

	if (!listing) {
		return <p>Объявление не найдено.</p>;
	}

	if (me && listing.author_id !== me.id) {
		return <Navigate to={`/listings/${listing.id}`} replace />;
	}

	return (
		<div>
			<h1>Редактирование объявления</h1>
			<ListingForm listing={listing} />
		</div>
	);
}
