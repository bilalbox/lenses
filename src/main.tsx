import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/source-sans-3/latin-400.css";
import "@fontsource/source-sans-3/latin-600.css";
import "@fontsource/literata/latin-400.css";
import "@fontsource/literata/latin-600.css";
import "@fontsource/scheherazade-new/arabic-400.css";
import "@fontsource/scheherazade-new/arabic-700.css";
import "@fontsource/scheherazade-new/latin-400.css";
import "@fontsource/scheherazade-new/latin-700.css";
import "@fontsource/noto-sans-arabic/arabic-400.css";
import { registerSW } from "virtual:pwa-register";
import { App } from "./App";
import { I18nProvider } from "./lib/i18n/I18nContext";
import "./index.css";

registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<I18nProvider>
			<App />
		</I18nProvider>
	</StrictMode>,
);
