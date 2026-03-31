export interface ShortcutItem {
	url: string;
	shortcut: string;
	name: string;
}

export interface Section {
	title: string;
	icon: string;
	items: ShortcutItem[];
}

export type TabGrid = Section[][];

export interface Tab {
	title: string;
	icon: string;
	data: TabGrid;
}

export interface StartpageConfig {
	title: string;
	quote: string;
	quickAccess: Section;
	tabs: TabDefinition[];
	/** Path or URL for the desktop wallpaper background image */
	backgroundImage?: string;
	/** Path or URL for the left sidebar content image (inside the window frame) */
	frameContentImage?: string;
}

export interface TabDefinition {
	title: string;
	icon: string;
	/** sections[0]=top-left, [1]=top-right, [2]=bottom-left. quickAccess fills bottom-right. */
	sections: Section[];
}

export interface ResolvedTab {
	title: string;
	icon: string;
	data: TabGrid;
}

export function resolveTab(tab: TabDefinition, quickAccess: Section): ResolvedTab {
	const empty: Section = { title: '', icon: '', items: [] };
	const s = tab.sections;
	return {
		title: tab.title,
		icon: tab.icon,
		data: [
			[s[0] ?? empty, s[1] ?? empty],
			[s[2] ?? empty, quickAccess]
		]
	};
}

export function resolveConfig(config: StartpageConfig): {
	title: string;
	quote: string;
	tabs: ResolvedTab[];
	backgroundImage?: string;
	frameContentImage?: string;
} {
	return {
		title: config.title,
		quote: config.quote,
		tabs: config.tabs.map((t) => resolveTab(t, config.quickAccess)),
		backgroundImage: config.backgroundImage,
		frameContentImage: config.frameContentImage
	};
}
