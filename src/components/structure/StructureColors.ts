import type { StructureRole } from "../../lib/types";

export interface RoleTheme {
	color: string;
	bg: string;
	border: string;
	labelEn: string;
	labelAr: string;
}

export function getRoleTheme(role: StructureRole): RoleTheme {
	if (
		role === "outer_frame_open" ||
		role === "outer_frame_close" ||
		role === "frame"
	) {
		return {
			color: "var(--teal)",
			bg: "color-mix(in srgb, var(--teal) 14%, var(--paper))",
			border: "color-mix(in srgb, var(--teal) 45%, var(--line))",
			labelEn: "Frame",
			labelAr: "إطار محيط",
		};
	}
	if (role === "pivot" || role === "center") {
		return {
			color: "var(--gold)",
			bg: "color-mix(in srgb, var(--gold) 22%, var(--paper))",
			border: "color-mix(in srgb, var(--gold) 60%, var(--line))",
			labelEn: "Pivot / Axis",
			labelAr: "المحور والمركز",
		};
	}
	if (role.startsWith("narrative")) {
		return {
			color: "var(--gold)",
			bg: "color-mix(in srgb, var(--gold) 14%, var(--paper))",
			border: "color-mix(in srgb, var(--gold) 45%, var(--line))",
			labelEn: "Narrative",
			labelAr: "قصصي",
		};
	}
	if (role.startsWith("transition")) {
		return {
			color: "var(--rose)",
			bg: "color-mix(in srgb, var(--rose) 14%, var(--paper))",
			border: "color-mix(in srgb, var(--rose) 45%, var(--line))",
			labelEn: "Transition",
			labelAr: "مفصل انتقالي",
		};
	}
	return {
		color: "var(--indigo)",
		bg: "color-mix(in srgb, var(--indigo) 14%, var(--paper))",
		border: "color-mix(in srgb, var(--indigo) 40%, var(--line))",
		labelEn: "Body",
		labelAr: "بنية داخلية",
	};
}
