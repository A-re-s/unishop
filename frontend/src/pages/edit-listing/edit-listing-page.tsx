import { useTranslation } from "react-i18next";
import { Navigate, useParams } from "react-router-dom";
import { useGetListingQuery } from "@/entities/listing/api/listing-api";
import { useGetMeQuery } from "@/entities/user/api/user-api";
import { ListingForm } from "@/widgets/listing-form/listing-form";

export function EditListingPage() {
	const { t } = useTranslation();
	const { listingId = "" } = useParams();
	const { data: listing, isLoading } = useGetListingQuery(listingId, {
		skip: !listingId,
	});
	const { data: me } = useGetMeQuery();

	if (isLoading) {
		return <p>{t("common.loading")}</p>;
	}

	if (!listing) {
		return <p>{t("listingDetail.notFound")}</p>;
	}

	if (me && listing.author_id !== me.id) {
		return <Navigate to={`/listings/${listing.id}`} replace />;
	}

	return (
		<div>
			<h1>{t("listingForm.editTitle")}</h1>
			<ListingForm listing={listing} />
		</div>
	);
}
