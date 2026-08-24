<script lang="ts">
	import { onMount } from 'svelte';
	import type { Section, StartpageConfig } from '$lib/types';
	import { SvelteMap } from 'svelte/reactivity';
	import ConfigEditor from '$lib/components/ConfigEditor.svelte';

	let { data } = $props();

	let time = $state(formatTime());
	let bgLoaded = $state(false);
	let currentTabIndex = $state(0);
	let editorOpen = $state(false);

	let tabs = $derived(data.resolved.tabs);
	let currentRows = $derived(tabs[currentTabIndex]?.data ?? []);
	let shortcutMap = $derived(buildShortcutMap(currentRows));

	let backgroundImage = $derived(data.resolved.backgroundImage ?? '/background.png');
	let frameContentImage = $derived(data.resolved.frameContentImage ?? '/window-content.png');

	let mainEl = $state<HTMLElement | undefined>();

	/**
	 * Lists wrap into extra columns on their own (see the `ul` rule in the
	 * stylesheet). When even the extra columns do not fit the box, shrink the
	 * list's text until it does, so a crowded section stays inside its square
	 * instead of spilling over the window.
	 */
	function fitLists(rows: Section[][] = currentRows) {
		if (!mainEl || rows.length === 0) return;
		for (const list of mainEl.querySelectorAll<HTMLElement>('ul')) {
			let fit = 1;
			list.style.setProperty('--fit', '1');
			while (fit > 0.5 && list.scrollWidth > list.clientWidth + 1) {
				fit -= 0.05;
				list.style.setProperty('--fit', fit.toFixed(2));
			}
		}
	}

	const refitLists = () => fitLists();

	$effect(() => {
		fitLists(currentRows);
	});

	function formatTime(): string {
		const now = new Date();
		return `${now.toLocaleDateString()} @${now.toLocaleTimeString()}`;
	}

	function buildShortcutMap(rows: Section[][]): SvelteMap<string, string> {
		const map = new SvelteMap<string, string>();
		for (const row of rows) {
			for (const section of row) {
				for (const item of section.items) {
					if (item.shortcut && item.shortcut !== '-') {
						map.set(item.shortcut, item.url);
					}
				}
			}
		}
		return map;
	}

	/** Enter/Space on a focused element behaves like a click. */
	function activateOnKey(e: KeyboardEvent, action: () => void) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			action();
		}
	}

	function handleKey(e: KeyboardEvent) {
		if (editorOpen) return;

		const key = e.key;

		if (key === 't') {
			currentTabIndex = (currentTabIndex + 1) % tabs.length;
			return;
		}
		if (key === 'T') {
			currentTabIndex = (currentTabIndex - 1 + tabs.length) % tabs.length;
			return;
		}

		if (shortcutMap.has(key)) {
			window.location.href = shortcutMap.get(key)!;
		}
	}

	async function handleConfigSave(config: StartpageConfig) {
		await fetch('/api/config', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(config)
		});
		editorOpen = false;
		window.location.reload();
	}

	onMount(() => {
		const img = new Image();
		img.src = backgroundImage;
		img.onload = () => {
			bgLoaded = true;
		};

		const interval = setInterval(() => {
			time = formatTime();
		}, 100);

		window.addEventListener('keydown', handleKey);
		window.addEventListener('resize', refitLists);
		document.fonts?.ready.then(refitLists);

		return () => {
			window.removeEventListener('keydown', handleKey);
			window.removeEventListener('resize', refitLists);
			clearInterval(interval);
		};
	});
</script>

<svelte:head>
	<link rel="preload" as="image" href={backgroundImage} />
	<link rel="preload" as="image" href={frameContentImage} />
</svelte:head>

<div
	class="wrapper"
	id="wrapper"
	class:bg-loaded={bgLoaded}
	style:background-image="url('{backgroundImage}')"
>
	<div class="scene">
		<div class="css-frame">
			<div class="frame-outer">
				<div class="frame-inner">
					<div class="frame-title-bar"></div>
					<div class="frame-body">
						<div class="frame-sidebar"></div>
						<div class="frame-right">
							<div class="frame-tab-strip"></div>
							<div class="frame-content"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="window-content" style:background-image="url('{frameContentImage}')"></div>
		<div class="top-container">
			<div class="title">
				<span>{data.resolved.title}</span>
			</div>
			<div class="time">
				<span>{time}</span>
			</div>
		</div>
		<div class="quote-container">
			<div class="quote-text">
				<span>{data.resolved.quote}</span>
			</div>
		</div>
		<div class="tab-bar-container">
			<div class="tab-bar">
				{#each tabs as tab, i (tab.title)}
					<div
						class="tab-title"
						class:active={i === currentTabIndex}
						onclick={() => (currentTabIndex = i)}
						onkeydown={(e) => activateOnKey(e, () => (currentTabIndex = i))}
						role="tab"
						tabindex="0"
						aria-selected={i === currentTabIndex}
					>
						<h1>{tab.title}</h1>
					</div>
				{/each}
			</div>
		</div>
		<div class="main-container">
			<div class="main" bind:this={mainEl}>
				{#each currentRows as row, ri (ri)}
					<div class="lists-container">
						{#each row as section, si (si)}
							<div class="column">
								{#if section.title || section.items.length}
									<h2>{section.icon} {section.title}</h2>
									<ul>
										{#each section.items as item (item.shortcut)}
											<li class="item">
												<a href={item.url} target="_blank" rel="noopener noreferrer"
													>({item.shortcut}) {item.name}</a
												>
											</li>
										{/each}
									</ul>
								{/if}
							</div>
						{/each}
					</div>
				{/each}
			</div>
		</div>

		<div
			class="desktop-icon"
			onclick={() => (editorOpen = true)}
			onkeydown={(e) => activateOnKey(e, () => (editorOpen = true))}
			role="button"
			tabindex="0"
			title="Click to edit configuration"
		>
			<div class="desktop-icon-img">⚙️</div>
			<div class="desktop-icon-label">Settings</div>
		</div>
	</div>
</div>

{#if editorOpen}
	<ConfigEditor
		config={data.config}
		onSave={handleConfigSave}
		onClose={() => (editorOpen = false)}
	/>
{/if}

<style>
	.wrapper {
		background-color: #000;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		width: 100vw;
		height: 100vh;
		display: grid;
		place-items: center;
	}

	.wrapper.bg-loaded {
		opacity: 1;
	}

	.scene {
		/* Everything inside the scene is sized in em, and the em is a fixed
		   fraction of the scene width. The whole window therefore scales as a
		   single unit: browser zoom changes how big it looks, never how it is
		   laid out. */
		--scene-width: min(1000px, 95vw, calc(95vh * 1000 / 610));
		position: relative;
		width: var(--scene-width);
		aspect-ratio: 1000 / 610;
		font-size: calc(var(--scene-width) / 62.5);
	}

	.css-frame {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 1;
	}

	.frame-outer {
		position: absolute;
		inset: 0;
		background: #c0c0c0;
		border-top: 2px solid #fff;
		border-left: 2px solid #fff;
		border-bottom: 2px solid #000;
		border-right: 2px solid #000;
	}

	.frame-inner {
		position: absolute;
		inset: 2px;
		background: #c0c0c0;
		border-top: 1px solid #dfdfdf;
		border-left: 1px solid #dfdfdf;
		border-bottom: 1px solid #808080;
		border-right: 1px solid #808080;
	}

	.frame-title-bar {
		position: absolute;
		left: 4px;
		top: 4px;
		width: calc(100% - 8px);
		height: 6.5%;
		background: #004e69;
	}

	.frame-body {
		position: absolute;
		left: 0;
		top: 8.5%;
		width: 100%;
		height: 91.5%;
		display: flex;
		padding: 0 4px 4px 4px;
		box-sizing: border-box;
		gap: 4px;
	}

	.frame-sidebar {
		width: 32%;
		height: 100%;
		background: #ffffff;
		border-top: 1px solid #808080;
		border-left: 1px solid #808080;
		border-bottom: 1px solid #dfdfdf;
		border-right: 1px solid #dfdfdf;
	}

	.frame-right {
		flex: 1;
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.frame-tab-strip {
		width: 100%;
		height: 6%;
		background: #a6d8ff;
		border-top: 1px solid #808080;
		border-left: 1px solid #808080;
		border-bottom: 1px solid #dfdfdf;
		border-right: 1px solid #dfdfdf;
	}

	.frame-content {
		flex: 1;
		background: #1d78a7;
		border-top: 1px solid #808080;
		border-left: 1px solid #808080;
		border-bottom: 1px solid #dfdfdf;
		border-right: 1px solid #dfdfdf;
	}

	.window-content,
	.top-container,
	.quote-container,
	.tab-bar-container,
	.main-container {
		position: absolute;
		z-index: 2;
		box-sizing: border-box;
	}

	.window-content {
		left: 1%;
		top: 9.3%;
		width: 31.3%;
		height: 89%;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}

	.top-container {
		left: 0;
		top: 0;
		width: 100%;
		height: 8.5%;
		padding: 1.2% 2%;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.top-container .title,
	.top-container .time {
		font-weight: bold;
		font-size: 1.3em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.top-container .time {
		flex: none;
		padding-left: 1em;
	}

	.quote-container {
		left: 34.2%;
		top: 8.4%;
		width: 64.5%;
		height: 5.5%;
		display: flex;
		align-items: center;
		padding-left: 1%;
	}

	.quote-text {
		color: #222;
		font-style: italic;
		font-size: 1.4em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tab-bar-container {
		left: 34.8%;
		top: 15.5%;
		width: 62.5%;
		height: 9%;
		display: flex;
		align-items: center;
		padding: 0 1%;
		overflow: hidden;
	}

	.tab-bar {
		width: 100%;
		display: flex;
		gap: 1em;
		padding-top: 0.5em;
		justify-content: space-around;
		flex-wrap: nowrap;
		overflow: hidden;
	}

	.tab-title {
		min-width: 0;
	}

	.tab-title h1 {
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tab-title.active h1 {
		font-weight: 600;
		color: yellow;
		text-shadow:
			-1px 0 0 blue,
			0 -1px 0 blue;
	}

	.tab-title h1 {
		text-align: center;
		color: blue;
		text-shadow:
			-1px 0 0 yellow,
			0 -1px 0 yellow;
	}

	.tab-title {
		cursor: pointer;
	}

	.main-container {
		left: 34.8%;
		top: 24.5%;
		width: 62.5%;
		height: 72%;
		padding: 1%;
		display: flex;
	}

	.main {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.lists-container {
		display: flex;
		gap: 2em;
		width: 100%;
		flex: 1 1 0;
		min-height: 0;
	}

	.column {
		flex: 1 1 0;
		min-width: 0;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}

	h2 {
		font-size: 2em;
		margin: 0 0 0.5em 0;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* A wrapping flex column: items stack downwards until they run out of
	   room, then continue in a new column to the right instead of spilling
	   out of the box. */
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		font-size: calc(1em * var(--fit, 1));
		flex: 1 1 0;
		min-height: 0;
		display: flex;
		flex-flow: column wrap;
		align-content: flex-start;
		align-items: flex-start;
		column-gap: 1.5em;
		row-gap: 0.4em;
		overflow: hidden;
	}

	li {
		flex: 0 0 auto;
		max-width: 100%;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	a {
		color: #00ffe5;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}

	.item {
		font-size: 1.1em;
	}

	.desktop-icon {
		position: absolute;
		left: 3%;
		bottom: 4%;
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: center;
		cursor: pointer;
		padding: 0.5em;
		border-radius: 4px;
		user-select: none;
	}

	.desktop-icon:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.desktop-icon:active {
		background: rgba(255, 255, 255, 0.25);
	}

	.desktop-icon-img {
		width: 3em;
		height: 3em;
		font-size: 1em;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.desktop-icon-label {
		margin-top: 0.3em;
		font-size: 0.85em;
		color: #fff;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
		text-align: center;
		white-space: nowrap;
	}
</style>
