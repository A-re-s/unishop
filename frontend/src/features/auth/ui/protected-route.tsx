import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { useGetMeQuery } from "@/entities/user/api/user-api";

export function ProtectedRoute({ children }: PropsWithChildren) {
	const { isLoading, isError } = useGetMeQuery();

	if (isLoading) {
		return <div>Загрузка...</div>;
	}

	if (isError) {
		return <Navigate to="/login" replace />;
	}

	return <>{children}</>;
}
