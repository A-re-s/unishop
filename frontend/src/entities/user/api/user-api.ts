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
		updateMe: builder.mutation<
			User,
			{ username?: string; telegram_username?: string }
		>({
			query: (data) => ({ url: "/v1/users/me", method: "PATCH", body: data }),
			invalidatesTags: ["User"],
		}),
		uploadAvatar: builder.mutation<User, File>({
			query: (file) => {
				const body = new FormData();
				body.append("file", file);
				return { url: "/v1/users/me/avatar", method: "POST", body };
			},
			invalidatesTags: ["User"],
		}),
		deleteAvatar: builder.mutation<User, void>({
			query: () => ({ url: "/v1/users/me/avatar", method: "DELETE" }),
			invalidatesTags: ["User"],
		}),
		logout: builder.mutation<{ status: string }, void>({
			query: () => ({ url: "/v1/auth/logout", method: "POST" }),
			invalidatesTags: ["User"],
		}),
	}),
});

export const {
	useGetMeQuery,
	useGetUserQuery,
	useUpdateMeMutation,
	useUploadAvatarMutation,
	useDeleteAvatarMutation,
	useLogoutMutation,
} = userApi;
