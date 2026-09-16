import { baseApi } from "@/shared/api/base-api";
import type { User } from "../model/types";

export const userApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getMe: builder.query<User, void>({
			query: () => "/v1/auth/me",
			providesTags: ["User"],
		}),
		logout: builder.mutation<{ status: string }, void>({
			query: () => ({ url: "/v1/auth/logout", method: "POST" }),
			invalidatesTags: ["User"],
		}),
	}),
});

export const { useGetMeQuery, useLogoutMutation } = userApi;
