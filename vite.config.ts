import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: [
				"favicon.svg",
				"favicon.png",
				"icons/icon-192.png",
				"icons/icon-512.png",
			],
			manifest: {
				name: "عدسات — Lenses",
				short_name: "عدسات",
				description:
					"Quranic Arabic word by word: morphology, a dependency tree, and classical iʿrāb.",
				theme_color: "#0f6e66",
				background_color: "#f3efe6",
				display: "standalone",
				start_url: "/",
				lang: "en",
				icons: [
					{
						src: "icons/icon-192.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "icons/icon-512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any maskable",
					},
				],
			},
			workbox: {
				globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
				maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
				navigateFallback: "index.html",
				navigateFallbackDenylist: [/^\/data\//],
				skipWaiting: true,
				clientsClaim: true,
				runtimeCaching: [
					{
						urlPattern: ({ url }) => url.pathname.startsWith("/data/quran/"),
						handler: "StaleWhileRevalidate",
						options: {
							cacheName: "lenses-quran",
							cacheableResponse: { statuses: [200] },
							expiration: { maxEntries: 130 },
						},
					},
					{
						urlPattern: ({ url }) =>
							url.pathname.endsWith(".woff2") || url.pathname.endsWith(".woff"),
						handler: "CacheFirst",
						options: {
							cacheName: "lenses-fonts",
							cacheableResponse: { statuses: [200] },
							expiration: { maxEntries: 40 },
						},
					},
				],
			},
			devOptions: {
				enabled: true,
				suppressWarnings: true,
			},
		}),
	],
	server: {
		host: "127.0.0.1",
		port: 43123,
	},
	preview: {
		host: "127.0.0.1",
		port: 43123,
	},
});
