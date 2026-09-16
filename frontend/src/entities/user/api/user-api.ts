import { baseApi } from "@/shared/api/base-api";
import type { User } from "../model/types";

export const userApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getMe: builder.query<User, void>({
			query: () => "/v1/auth/me",
			providesTags: ["User"],
		}),
		getUser: builder.query<User, string>({
			query: (userId) => `/v1/users/${userId}`,
			providesTags: (_result, _error, userId) => [{ type: "User", id: userId }],
		}),
		logout: builder.mutation<{ status: string }, void>({
			query: () => ({ url: "/v1/auth/logout", method: "POST" }),
			invalidatesTags: ["User"],
		}),
	}),
});

export const { useGetMeQuery, useGetUserQuery, useLogoutMutation } = userApi;
