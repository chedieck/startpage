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

	let openInNewTab = $derived(data.resolved.openInNewTab ?? false);
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

	/** Follow a link the way the config asks for: in place, or in a new tab. */
	function openLink(url: string) {
		if (openInNewTab) {
			window.open(url, '_blank', 'noopener');
		} else {
			window.location.href = url;
		}
	}

	function handleKey(e: KeyboardEvent) {
		if (editorOpen) return;

		const key = e.key;

		// Tab cycles tabs, so every printable key is free to be a link shortcut.
		if (key === 'Tab') {
			e.preventDefault();
			const step = e.shiftKey ? -1 : 1;
			currentTabIndex = (currentTabIndex + step + tabs.length) % tabs.length;
			return;
		}

		if (shortcutMap.has(key)) {
			openLink(shortcutMap.get(key)!);
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
	<!-- The window chrome is the layout: every piece of content lives inside the
	     frame element it belongs to, so nothing can drift out of alignment. -->
	<div class="scene">
		<div class="frame-outer">
			<div class="frame-inner">
				<div class="frame-title-bar">
					<span class="title">{data.resolved.title}</span>
					<span class="time">{time}</span>
				</div>
				<div class="frame-body">
					<div class="frame-sidebar" style:background-image="url('{frameContentImage}')">
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
					<div class="frame-right">
						<div class="frame-tab-strip">
							<span class="quote-text">{data.resolved.quote}</span>
						</div>
						<div class="frame-content">
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
																<a
																	href={item.url}
																	target={openInNewTab ? '_blank' : null}
																	rel="noopener noreferrer">({item.shortcut}) {item.name}</a
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
					</div>
				</div>
			</div>
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
		/* Everything inside the scene is sized in em or %, and the em is a fixed
		   fraction of the scene width. The whole window therefore scales as a
		   single unit: browser zoom changes how big it looks, never how it is
		   laid out. */
		--scene-width: min(1000px, 95vw, calc(95vh * 1000 / 610));
		position: relative;
		width: var(--scene-width);
		aspect-ratio: 1000 / 610;
		font-size: calc(var(--scene-width) / 62.5);
	}

	/* ---- window chrome ---- */

	.frame-outer {
		position: absolute;
		inset: 0;
		background: #c0c0c0;
		border-top: 2px solid #fff;
		border-left: 2px solid #fff;
		border-bottom: 2px solid #000;
		border-right: 2px solid #000;
		box-sizing: border-box;
	}

	.frame-inner {
		position: absolute;
		inset: 0;
		background: #c0c0c0;
		border-top: 1px solid #dfdfdf;
		border-left: 1px solid #dfdfdf;
		border-bottom: 1px solid #808080;
		border-right: 1px solid #808080;
		box-sizing: border-box;
		padding: 4px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.frame-title-bar,
	.frame-sidebar,
	.frame-tab-strip,
	.frame-content {
		box-sizing: border-box;
		min-width: 0;
		min-height: 0;
	}

	.frame-title-bar {
		flex: 0 0 6.7%;
		background: #004e69;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1em;
		padding: 0 0.9em;
	}

	.frame-body {
		flex: 1;
		display: flex;
		gap: 4px;
		min-height: 0;
	}

	.frame-sidebar {
		flex: 0 0 32%;
		position: relative;
		background-color: #ffffff;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		border-top: 1px solid #808080;
		border-left: 1px solid #808080;
		border-bottom: 1px solid #dfdfdf;
		border-right: 1px solid #dfdfdf;
	}

	.frame-right {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.frame-tab-strip {
		flex: 0 0 6.2%;
		background: #a6d8ff;
		border-top: 1px solid #808080;
		border-left: 1px solid #808080;
		border-bottom: 1px solid #dfdfdf;
		border-right: 1px solid #dfdfdf;
		display: flex;
		align-items: center;
		padding: 0 0.8em;
	}

	.frame-content {
		flex: 1;
		background: #1d78a7;
		border-top: 1px solid #808080;
		border-left: 1px solid #808080;
		border-bottom: 1px solid #dfdfdf;
		border-right: 1px solid #dfdfdf;
		display: flex;
		flex-direction: column;
		padding: 0.5em 1.6em 1.2em 1.6em;
	}

	/* ---- title bar ---- */

	.title,
	.time {
		font-weight: bold;
		font-size: 1.3em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.time {
		flex: none;
	}

	/* ---- quote strip ---- */

	.quote-text {
		color: #222;
		font-style: italic;
		font-size: 1.4em;
		line-height: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* ---- tab bar ---- */

	.tab-bar {
		flex: 0 0 auto;
		display: flex;
		justify-content: space-around;
		align-items: center;
		gap: 1em;
		padding: 0.7em 0 1em 0;
		overflow: hidden;
	}

	.tab-title {
		min-width: 0;
		cursor: pointer;
	}

	.tab-title h1 {
		margin: 0;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: blue;
		text-shadow:
			-1px 0 0 yellow,
			0 -1px 0 yellow;
	}

	.tab-title.active h1 {
		font-weight: 600;
		color: yellow;
		text-shadow:
			-1px 0 0 blue,
			0 -1px 0 blue;
	}

	/* ---- the 2x2 grid of link lists ---- */

	.main {
		flex: 1;
		min-height: 0;
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

	/* ---- settings icon, sitting on the sidebar image ---- */

	.desktop-icon {
		position: absolute;
		left: 5%;
		bottom: 2%;
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
