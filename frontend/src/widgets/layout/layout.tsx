import { useTranslation } from "react-i18next";
import { NavLink, Outlet } from "react-router-dom";
import styles from "./layout.module.css";

export function Layout() {
	const { t } = useTranslation();

	return (
		<div className={styles.root}>
			<nav className={styles.nav}>
				<NavLink
					to="/"
					end
					className={({ isActive }) =>
						isActive ? styles.activeLink : styles.link
					}
				>
					{t("nav.recommendations")}
				</NavLink>
				<NavLink
					to="/favorites"
					className={({ isActive }) =>
						isActive ? styles.activeLink : styles.link
					}
				>
					{t("nav.favorites")}
				</NavLink>
				<NavLink
					to="/listings/create"
					className={({ isActive }) =>
						isActive ? styles.activeLink : styles.link
					}
				>
					{t("nav.createListing")}
				</NavLink>
				<NavLink
					to="/profile"
					className={({ isActive }) =>
						isActive ? styles.activeLink : styles.link
					}
				>
					{t("nav.profile")}
				</NavLink>
			</nav>
			<main className={styles.content}>
				<Outlet />
			</main>
		</div>
	);
}
