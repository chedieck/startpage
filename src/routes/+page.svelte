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

		return () => {
			window.removeEventListener('keydown', handleKey);
			clearInterval(interval);
		};
	});
</script>

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
			<div class="main">
				{#each currentRows as row, ri (ri)}
					<div class="lists-container">
						{#each row as section, si (si)}
							<div class="column {section.items.length === 0 ? 'empty' : ''}">
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
							</div>
						{/each}
					</div>
				{/each}
			</div>
		</div>

		<div
			class="desktop-icon"
			onclick={() => (editorOpen = true)}
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
	.empty {
		z-index: -1281;
	}
	.wrapper {
		background: #000 url('/background.png') center / cover no-repeat;
		background-size: cover;
		background-position: center;
		width: 100vw;
		height: 100vh;
		display: grid;
		place-items: center;
	}

	.wrapper.bg-loaded {
		opacity: 1;
	}

	.scene {
		position: relative;
		width: min(1000px, 95vw, calc(95vh * 1000 / 610));
		aspect-ratio: 1000 / 610;
		font-size: clamp(12px, 1.35vmin, 18px);
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
		height: 7.5%;
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
		height: 9%;
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
		left: 2.1%;
		top: 8.8%;
		width: 31.5%;
		height: 88.5%;
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
		font-size: 1.2em;
	}

	.tab-bar-container {
		left: 40%;
		top: 15.5%;
		width: 50%;
		height: 9%;
		display: flex;
		align-items: center;
	}

	.tab-bar {
		width: 100%;
		display: flex;
		gap: 1.5rem;
		justify-content: space-around;
		flex-wrap: nowrap;
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
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.lists-container {
		display: flex;
		gap: 3rem;
		width: 100%;
		height: 50%;
	}

	.column {
		width: 50%;
	}

	h2 {
		font-size: 2em;
		margin-bottom: 1rem;
		text-align: center;
	}

	ul {
		list-style: none;
		padding: 0;
	}

	li {
		margin: 0.5rem 0;
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
		padding: 0.5rem;
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
