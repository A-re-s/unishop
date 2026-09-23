import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetCategoriesQuery } from "@/entities/category/api/category-api";
import type { ListingsQueryParams } from "@/entities/listing/api/listing-api";
import { useListingStatusLabels } from "@/entities/listing/lib/use-listing-labels";
import type { Listing, ListingStatus } from "@/entities/listing/model/types";
import { ListingCard } from "@/entities/listing/ui/listing-card";
import { useGetMeQuery } from "@/entities/user/api/user-api";
import type { Page } from "@/shared/api/types";
import { useDebouncedValue } from "@/shared/lib/use-debounced-value";
import styles from "./listing-feed.module.css";

const PAGE_SIZE = 20;

type SortOption =
	| "created_at:desc"
	| "created_at:asc"
	| "price:asc"
	| "price:desc";

interface ListingFeedProps {
	useListingsQuery: (params: ListingsQueryParams) => {
		data?: Page<Listing>;
		isLoading: boolean;
		isFetching: boolean;
	};
	fixedParams?: Partial<ListingsQueryParams>;
	defaultStatus?: ListingStatus | "";
	emptyMessage?: string;
}

export function ListingFeed({
	useListingsQuery,
	fixedParams,
	defaultStatus = "",
	emptyMessage,
}: ListingFeedProps) {
	const { t } = useTranslation();
	const listingStatusLabels = useListingStatusLabels();
	const sortLabels: Record<SortOption, string> = {
		"created_at:desc": t("listingFeed.sort.createdDesc"),
		"created_at:asc": t("listingFeed.sort.createdAsc"),
		"price:asc": t("listingFeed.sort.priceAsc"),
		"price:desc": t("listingFeed.sort.priceDesc"),
	};

	const [search, setSearch] = useState("");
	const [categoryId, setCategoryId] = useState("");
	const [status, setStatus] = useState<ListingStatus | "">(defaultStatus);
	const [sort, setSort] = useState<SortOption>("created_at:desc");
	const [page, setPage] = useState(1);

	const debouncedSearch = useDebouncedValue(search, 400);
	const [sortBy, order] = sort.split(":") as [
		"created_at" | "price",
		"asc" | "desc",
	];

	const { data: me } = useGetMeQuery();
	const { data: categories } = useGetCategoriesQuery();
	const categoryNameById = useMemo(
		() =>
			new Map(
				(categories ?? []).map((category) => [category.id, category.name]),
			),
		[categories],
	);

	const { data, isLoading, isFetching } = useListingsQuery({
		search: debouncedSearch || undefined,
		category_id: categoryId || undefined,
		status: status || undefined,
		sort_by: sortBy,
		order,
		page,
		size: PAGE_SIZE,
		...fixedParams,
	});

	const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

	function updateAndResetPage<T>(setter: (value: T) => void) {
		return (value: T) => {
			setter(value);
			setPage(1);
		};
	}

	return (
		<div>
			<div className={styles.controls}>
				<input
					className={styles.search}
					type="search"
					placeholder={t("listingFeed.searchPlaceholder")}
					value={search}
					onChange={(event) =>
						updateAndResetPage(setSearch)(event.target.value)
					}
				/>
				<select
					value={categoryId}
					onChange={(event) =>
						updateAndResetPage(setCategoryId)(event.target.value)
					}
				>
					<option value="">{t("listingFeed.allCategories")}</option>
					{categories?.map((category) => (
						<option key={category.id} value={category.id}>
							{category.name}
						</option>
					))}
				</select>
				<select
					value={status}
					onChange={(event) =>
						updateAndResetPage(setStatus)(
							event.target.value as ListingStatus | "",
						)
					}
				>
					<option value="">{t("listingFeed.anyStatus")}</option>
					{Object.entries(listingStatusLabels).map(([value, label]) => (
						<option key={value} value={value}>
							{label}
						</option>
					))}
				</select>
				<select
					value={sort}
					onChange={(event) =>
						updateAndResetPage(setSort)(event.target.value as SortOption)
					}
				>
					{Object.entries(sortLabels).map(([value, label]) => (
						<option key={value} value={value}>
							{label}
						</option>
					))}
				</select>
			</div>

			{isLoading ? (
				<p>{t("common.loading")}</p>
			) : !data || data.items.length === 0 ? (
				<p>{emptyMessage ?? t("listingFeed.defaultEmpty")}</p>
			) : (
				<div className={styles.grid} aria-busy={isFetching}>
					{data.items.map((listing) => (
						<ListingCard
							key={listing.id}
							listing={listing}
							categoryName={categoryNameById.get(listing.category_id)}
							isOwn={listing.author_id === me?.id}
						/>
					))}
				</div>
			)}

			{totalPages > 1 && (
				<div className={styles.pagination}>
					<button
						type="button"
						disabled={page <= 1}
						onClick={() => setPage((p) => p - 1)}
					>
						{t("listingFeed.prev")}
					</button>
					<span>{t("listingFeed.pageOf", { page, total: totalPages })}</span>
					<button
						type="button"
						disabled={page >= totalPages}
						onClick={() => setPage((p) => p + 1)}
					>
						{t("listingFeed.next")}
					</button>
				</div>
			)}
		</div>
	);
}
