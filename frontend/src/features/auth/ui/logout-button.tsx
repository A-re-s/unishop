import { useLogoutMutation } from "@/entities/user/api/user-api";

export function LogoutButton() {
	const [logout, { isLoading }] = useLogoutMutation();

	return (
		<button type="button" onClick={() => logout()} disabled={isLoading}>
			Выйти
		</button>
	);
}
