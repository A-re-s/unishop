import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { bootstrapLocale } from "@/entities/locale/lib/bootstrap-locale";
import { App } from "./app/app";
import "./app/styles/global.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Root element #root was not found");
}

bootstrapLocale().then(() => {
	createRoot(rootElement).render(
		<StrictMode>
			<App />
		</StrictMode>,
	);
});
