import {
	createContext,
	type PropsWithChildren,
	useCallback,
	useContext,
	useState,
} from "react";
import { generateId } from "@/shared/lib/generate-id";
import styles from "./toast-provider.module.css";

type ToastType = "success" | "error";

interface ToastItem {
	id: string;
	message: string;
	type: ToastType;
}

interface ToastContextValue {
	showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 4000;

export function ToastProvider({ children }: PropsWithChildren) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);

	const showToast = useCallback(
		(message: string, type: ToastType = "success") => {
			const id = generateId();
			setToasts((prev) => [...prev, { id, message, type }]);
			setTimeout(() => {
				setToasts((prev) => prev.filter((toast) => toast.id !== id));
			}, TOAST_DURATION_MS);
		},
		[],
	);

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			<div className={styles.container} role="status" aria-live="polite">
				{toasts.map((toast) => (
					<div
						key={toast.id}
						className={toast.type === "error" ? styles.error : styles.success}
					>
						{toast.message}
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
}
