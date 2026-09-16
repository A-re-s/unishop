import { baseApi } from "@/shared/api/base-api";
import type { Page } from "@/shared/api/types";
import type {
	Listing,
	ListingFormValues,
	ListingPhoto,
	ListingStatus,
} from "../model/types";

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
		getListing: builder.query<Listing, string>({
			query: (listingId) => `/v1/listings/${listingId}`,
			providesTags: (_result, _error, listingId) => [
				{ type: "Listing", id: listingId },
			],
		}),
		createListing: builder.mutation<Listing, ListingFormValues>({
			query: (data) => ({ url: "/v1/listings", method: "POST", body: data }),
			invalidatesTags: [{ type: "Listing", id: "LIST" }],
		}),
		updateListing: builder.mutation<
			Listing,
			{ id: string; data: Partial<ListingFormValues> }
		>({
			query: ({ id, data }) => ({
				url: `/v1/listings/${id}`,
				method: "PATCH",
				body: data,
			}),
			invalidatesTags: (_result, _error, { id }) => [
				{ type: "Listing", id },
				{ type: "Listing", id: "LIST" },
			],
		}),
		deleteListing: builder.mutation<void, string>({
			query: (listingId) => ({
				url: `/v1/listings/${listingId}`,
				method: "DELETE",
			}),
			invalidatesTags: (_result, _error, listingId) => [
				{ type: "Listing", id: listingId },
				{ type: "Listing", id: "LIST" },
			],
		}),
		updateListingStatus: builder.mutation<
			Listing,
			{ id: string; status: ListingStatus }
		>({
			query: ({ id, status }) => ({
				url: `/v1/listings/${id}/status`,
				method: "PATCH",
				body: { status },
			}),
			invalidatesTags: (_result, _error, { id }) => [
				{ type: "Listing", id },
				{ type: "Listing", id: "LIST" },
			],
		}),
		uploadListingPhoto: builder.mutation<
			ListingPhoto,
			{ listingId: string; file: File }
		>({
			query: ({ listingId, file }) => {
				const body = new FormData();
				body.append("file", file);
				return {
					url: `/v1/listings/${listingId}/photos`,
					method: "POST",
					body,
				};
			},
			invalidatesTags: (_result, _error, { listingId }) => [
				{ type: "Listing", id: listingId },
			],
		}),
		deleteListingPhoto: builder.mutation<
			void,
			{ listingId: string; photoId: string }
		>({
			query: ({ listingId, photoId }) => ({
				url: `/v1/listings/${listingId}/photos/${photoId}`,
				method: "DELETE",
			}),
			invalidatesTags: (_result, _error, { listingId }) => [
				{ type: "Listing", id: listingId },
			],
		}),
		favoriteListing: builder.mutation<void, string>({
			query: (listingId) => ({
				url: `/v1/listings/${listingId}/favorite`,
				method: "POST",
			}),
			// Also invalidate LIST: a newly-favorited listing wasn't part of the
			// favorites list result yet, so its own tag alone wouldn't be enough
			// to make that list query refetch.
			invalidatesTags: (_result, _error, listingId) => [
				{ type: "Listing", id: listingId },
				{ type: "Listing", id: "LIST" },
			],
		}),
		unfavoriteListing: builder.mutation<void, string>({
			query: (listingId) => ({
				url: `/v1/listings/${listingId}/favorite`,
				method: "DELETE",
			}),
			invalidatesTags: (_result, _error, listingId) => [
				{ type: "Listing", id: listingId },
				{ type: "Listing", id: "LIST" },
			],
		}),
	}),
});

export const {
	useGetListingsQuery,
	useGetFavoritesQuery,
	useGetListingQuery,
	useCreateListingMutation,
	useUpdateListingMutation,
	useDeleteListingMutation,
	useUpdateListingStatusMutation,
	useUploadListingPhotoMutation,
	useDeleteListingPhotoMutation,
	useFavoriteListingMutation,
	useUnfavoriteListingMutation,
} = listingApi;
