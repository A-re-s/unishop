import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { router } from "./providers/router";
import { store } from "./providers/store";

export function App() {
	return (
		<Provider store={store}>
			<RouterProvider router={router} />
		</Provider>
	);
}
