import { baseApi } from "@/shared/api/base-api";
import type { Category } from "../model/types";

export const categoryApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getCategories: builder.query<Category[], void>({
			query: () => "/v1/categories",
			providesTags: ["Category"],
		}),
	}),
});

export const { useGetCategoriesQuery } = categoryApi;
