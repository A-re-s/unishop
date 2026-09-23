import { useTranslation } from "react-i18next";
import { ListingForm } from "@/widgets/listing-form/listing-form";

export function CreateListingPage() {
	const { t } = useTranslation();

	return (
		<div>
			<h1>{t("listingForm.createTitle")}</h1>
			<ListingForm />
		</div>
	);
}
