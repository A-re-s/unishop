import { useTranslation } from "react-i18next";
import { useGetListingsQuery } from "@/entities/listing/api/listing-api";
import { ListingFeed } from "@/widgets/listing-feed/listing-feed";

export function HomePage() {
	const { t } = useTranslation();

	return (
		<div>
			<h1>{t("homePage.title")}</h1>
			<ListingFeed
				useListingsQuery={useGetListingsQuery}
				defaultStatus="active"
				emptyMessage={t("homePage.empty")}
			/>
		</div>
	);
}
