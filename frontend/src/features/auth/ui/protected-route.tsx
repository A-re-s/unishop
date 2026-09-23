import type { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { useGetMeQuery } from "@/entities/user/api/user-api";

export function ProtectedRoute({ children }: PropsWithChildren) {
	const { t } = useTranslation();
	const { isLoading, isError } = useGetMeQuery();

	if (isLoading) {
		return <div>{t("common.loading")}</div>;
	}

	if (isError) {
		return <Navigate to="/login" replace />;
	}

	return <>{children}</>;
}
