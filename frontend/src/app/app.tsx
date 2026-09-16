import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { ToastProvider } from "@/shared/ui/toast/toast-provider";
import { router } from "./providers/router";
import { store } from "./providers/store";

export function App() {
	return (
		<Provider store={store}>
			<ToastProvider>
				<RouterProvider router={router} />
			</ToastProvider>
		</Provider>
	);
}
