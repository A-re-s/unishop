import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { env } from "../config/env";

// Session lives in an httponly cookie set by the backend — the frontend
// never sees or stores a token itself, just always sends cookies along.
export const baseApi = createApi({
	reducerPath: "api",
	baseQuery: fetchBaseQuery({
		baseUrl: env.apiUrl,
		credentials: "include",
	}),
	tagTypes: ["User", "Listing", "Category", "Favorite"],
	endpoints: () => ({}),
});
