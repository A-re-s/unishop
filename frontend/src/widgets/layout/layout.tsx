import { NavLink, Outlet } from "react-router-dom";
import styles from "./layout.module.css";

export function Layout() {
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
					Рекомендации
				</NavLink>
				<NavLink
					to="/favorites"
					className={({ isActive }) =>
						isActive ? styles.activeLink : styles.link
					}
				>
					Избранное
				</NavLink>
				<NavLink
					to="/listings/create"
					className={({ isActive }) =>
						isActive ? styles.activeLink : styles.link
					}
				>
					+
				</NavLink>
				<NavLink
					to="/profile"
					className={({ isActive }) =>
						isActive ? styles.activeLink : styles.link
					}
				>
					Профиль
				</NavLink>
			</nav>
			<main className={styles.content}>
				<Outlet />
			</main>
		</div>
	);
}
