import { baseApi } from "@/shared/api/base-api";
import type { Page } from "@/shared/api/types";
import type { Listing, ListingStatus } from "../model/types";

export interface ListingsQueryParams {
	search?: string;
	category_id?: string;
	status?: ListingStatus;
	author_id?: string;
	sort_by?: "created_at" | "price";
	order?: "asc" | "desc";
	page?: number;
	size?: number;
}

function listingListTags(result: Page<Listing> | undefined) {
	return result
		? [
				...result.items.map((item) => ({
					type: "Listing" as const,
					id: item.id,
				})),
				{ type: "Listing" as const, id: "LIST" },
			]
		: [{ type: "Listing" as const, id: "LIST" }];
}

export const listingApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getListings: builder.query<Page<Listing>, ListingsQueryParams>({
			query: (params) => ({ url: "/v1/listings", params }),
			providesTags: listingListTags,
		}),
		getFavorites: builder.query<Page<Listing>, ListingsQueryParams>({
			query: (params) => ({ url: "/v1/favorites", params }),
			providesTags: listingListTags,
		}),
		favoriteListing: builder.mutation<void, string>({
			query: (listingId) => ({
				url: `/v1/listings/${listingId}/favorite`,
				method: "POST",
			}),
			invalidatesTags: (_result, _error, listingId) => [
				{ type: "Listing", id: listingId },
			],
		}),
		unfavoriteListing: builder.mutation<void, string>({
			query: (listingId) => ({
				url: `/v1/listings/${listingId}/favorite`,
				method: "DELETE",
			}),
			invalidatesTags: (_result, _error, listingId) => [
				{ type: "Listing", id: listingId },
			],
		}),
	}),
});

export const {
	useGetListingsQuery,
	useGetFavoritesQuery,
	useFavoriteListingMutation,
	useUnfavoriteListingMutation,
} = listingApi;
