import { useTranslation } from "react-i18next";
import type { ListingCondition, ListingStatus } from "../model/types";

export function useListingConditionLabels(): Record<ListingCondition, string> {
	const { t } = useTranslation();
	return {
		new: t("listingCondition.new"),
		used: t("listingCondition.used"),
	};
}

export function useListingStatusLabels(): Record<ListingStatus, string> {
	const { t } = useTranslation();
	return {
		active: t("listingStatus.active"),
		reserved: t("listingStatus.reserved"),
		sold: t("listingStatus.sold"),
	};
}
