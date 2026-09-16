import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/features/auth/ui/protected-route";
import { CreateListingPage } from "@/pages/create-listing/create-listing-page";
import { FavoritesPage } from "@/pages/favorites/favorites-page";
import { HomePage } from "@/pages/home/home-page";
import { ListingDetailPage } from "@/pages/listing-detail/listing-detail-page";
import { LoginPage } from "@/pages/login/login-page";
import { ProfilePage } from "@/pages/profile/profile-page";
import { Layout } from "@/widgets/layout/layout";

export const router = createBrowserRouter([
	{
		path: "/login",
		element: <LoginPage />,
	},
	{
		element: (
			<ProtectedRoute>
				<Layout />
			</ProtectedRoute>
		),
		children: [
			{ path: "/", element: <HomePage /> },
			{ path: "/listings/:listingId", element: <ListingDetailPage /> },
			{ path: "/favorites", element: <FavoritesPage /> },
			{ path: "/listings/create", element: <CreateListingPage /> },
			{ path: "/profile", element: <ProfilePage /> },
			{ path: "*", element: <Navigate to="/" replace /> },
		],
	},
]);
