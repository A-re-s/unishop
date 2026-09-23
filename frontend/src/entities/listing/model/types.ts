export type ListingCondition = "new" | "used";
export type ListingStatus = "active" | "reserved" | "sold";

export interface ListingPhoto {
	id: string;
	url: string;
}

export interface Listing {
	id: string;
	title: string;
	description: string;
	// Comes back from the backend as a decimal-safe string, not a number.
	price: string;
	category_id: string;
	condition: ListingCondition;
	status: ListingStatus;
	author_id: string;
	created_at: string;
	updated_at: string;
	is_favorite: boolean;
	photos: ListingPhoto[];
}

// Mirrors ALLOWED_STATUS_TRANSITIONS in backend/services/listing_service.py —
// determines which status-change buttons the owner sees on a listing.
export const ALLOWED_STATUS_TRANSITIONS: Record<
	ListingStatus,
	ListingStatus[]
> = {
	active: ["reserved", "sold"],
	reserved: ["active", "sold"],
	sold: [],
};

export const MAX_LISTING_PHOTOS = 10;

export interface ListingFormValues {
	title: string;
	description: string;
	price: string;
	category_id: string;
	condition: ListingCondition;
}
