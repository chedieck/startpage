<script lang="ts">
	import type { StartpageConfig, TabDefinition, Section, ShortcutItem } from '$lib/types';
	import { onMount } from 'svelte';

	interface Props {
		config: StartpageConfig;
		onSave: (config: StartpageConfig) => void;
		onClose: () => void;
	}

	let { config, onSave, onClose }: Props = $props();

	let localConfig = $state<StartpageConfig>({
		title: '',
		quote: '',
		quickAccess: { title: '', icon: '', items: [] },
		tabs: [],
		backgroundImage: undefined,
		frameContentImage: undefined,
		openInNewTab: false
	});

	let activeTab = $state(0);
	let uploadError = $state('');
	let windowX = $state(0);
	let windowY = $state(0);
	let isDragging = $state(false);
	let dragOffsetX = $state(0);
	let dragOffsetY = $state(0);

	const tabLabels = $derived([
		'Customization',
		'General',
		'Quick Access',
		...localConfig.tabs.map((t) => t.title)
	]);

	function deepClone<T>(obj: T): T {
		return JSON.parse(JSON.stringify(obj));
	}

	onMount(() => {
		localConfig = { openInNewTab: false, ...deepClone(config) };
		windowX = (window.innerWidth - 700) / 2;
		windowY = (window.innerHeight - 550) / 2;
	});

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	function startDrag(e: MouseEvent) {
		isDragging = true;
		dragOffsetX = e.clientX - windowX;
		dragOffsetY = e.clientY - windowY;
	}

	function handleDrag(e: MouseEvent) {
		if (isDragging) {
			windowX = e.clientX - dragOffsetX;
			windowY = e.clientY - dragOffsetY;
		}
	}

	function stopDrag() {
		isDragging = false;
	}

	function addItem(sectionIndex: number, isQuickAccess = false) {
		const newItem: ShortcutItem = { name: 'New Item', url: 'https://', shortcut: '' };
		if (isQuickAccess) {
			localConfig.quickAccess.items = [...localConfig.quickAccess.items, newItem];
		} else {
			const tabIdx = activeTab - 3;
			if (tabIdx >= 0 && localConfig.tabs[tabIdx]) {
				localConfig.tabs[tabIdx].sections[sectionIndex].items = [
					...localConfig.tabs[tabIdx].sections[sectionIndex].items,
					newItem
				];
			}
		}
	}

	function removeItem(sectionIndex: number, itemIndex: number, isQuickAccess = false) {
		if (isQuickAccess) {
			localConfig.quickAccess.items = localConfig.quickAccess.items.filter(
				(_, i) => i !== itemIndex
			);
		} else {
			const tabIdx = activeTab - 3;
			if (tabIdx >= 0 && localConfig.tabs[tabIdx]) {
				localConfig.tabs[tabIdx].sections[sectionIndex].items = localConfig.tabs[tabIdx].sections[
					sectionIndex
				].items.filter((_, i) => i !== itemIndex);
			}
		}
	}

	function addSection() {
		const tabIdx = activeTab - 3;
		if (tabIdx >= 0 && localConfig.tabs[tabIdx]) {
			const newSection: Section = { title: 'New Section', icon: '📁', items: [] };
			localConfig.tabs[tabIdx].sections = [...localConfig.tabs[tabIdx].sections, newSection];
		}
	}

	function removeSection(sectionIndex: number) {
		const tabIdx = activeTab - 3;
		if (tabIdx >= 0 && localConfig.tabs[tabIdx]) {
			localConfig.tabs[tabIdx].sections = localConfig.tabs[tabIdx].sections.filter(
				(_, i) => i !== sectionIndex
			);
		}
	}

	function addTab() {
		const newTab: TabDefinition = {
			title: 'New Tab',
			icon: 'T',
			sections: [{ title: 'Section 1', icon: '📁', items: [] }]
		};
		localConfig.tabs = [...localConfig.tabs, newTab];
		activeTab = localConfig.tabs.length + 2;
	}

	function removeTab(tabIndex: number) {
		localConfig.tabs = localConfig.tabs.filter((_, i) => i !== tabIndex);
		if (activeTab > 2 && activeTab >= tabIndex + 3) {
			activeTab = Math.max(0, activeTab - 1);
		}
	}

	function moveTab(tabIndex: number, direction: -1 | 1) {
		const target = tabIndex + direction;
		if (target < 0 || target >= localConfig.tabs.length) return;
		const tabs = [...localConfig.tabs];
		[tabs[tabIndex], tabs[target]] = [tabs[target], tabs[tabIndex]];
		localConfig.tabs = tabs;
		activeTab = target + 3;
	}

	async function uploadImage(file: File, slot: 'background' | 'frameContent') {
		const ext = file.name.split('.').pop() ?? '';
		// Sent as a raw body, not a form: see the note in src/routes/api/images.
		const response = await fetch(`/api/images?slot=${slot}&ext=${encodeURIComponent(ext)}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/octet-stream' },
			body: file
		});

		if (!response.ok) {
			uploadError = `Upload failed (${response.status}). Check the server log.`;
			return;
		}

		uploadError = '';
		const result = await response.json();
		if (slot === 'background') {
			localConfig.backgroundImage = result.path;
		} else {
			localConfig.frameContentImage = result.path;
		}
	}

	function handleBackgroundUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files?.[0]) {
			uploadImage(input.files[0], 'background');
		}
	}

	function handleFrameContentUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files?.[0]) {
			uploadImage(input.files[0], 'frameContent');
		}
	}

	/** Drop the custom image so the bundled default is used again. */
	function resetImage(slot: 'background' | 'frameContent') {
		if (slot === 'background') {
			localConfig.backgroundImage = undefined;
		} else {
			localConfig.frameContentImage = undefined;
		}
	}

	function handleSave() {
		onSave(localConfig);
	}
</script>

<svelte:window onkeydown={handleKeydown} onmousemove={handleDrag} onmouseup={stopDrag} />

<div
	class="backdrop"
	onclick={handleBackdropClick}
	onkeydown={handleKeydown}
	role="dialog"
	tabindex="-1"
	aria-modal="true"
	aria-labelledby="window-title"
>
	<div class="window" style="left: {windowX}px; top: {windowY}px;" role="document">
		<!-- The title bar is a mouse-only drag handle; the window is fully usable without it. -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="title-bar" onmousedown={startDrag}>
			<div class="title-text" id="window-title">Settings</div>
			<div class="title-buttons">
				<button class="title-btn minimize" aria-label="Minimize">_</button>
				<button class="title-btn maximize" aria-label="Maximize">□</button>
				<button class="title-btn close" onclick={onClose} aria-label="Close">×</button>
			</div>
		</div>

		<div class="window-body">
			<div class="tab-strip">
				{#each tabLabels as label, i (label)}
					<button class="tab" class:active={activeTab === i} onclick={() => (activeTab = i)}>
						{label}
					</button>
				{/each}
				<button class="tab add-tab" onclick={addTab}>+</button>
			</div>

			<div class="tab-content">
				{#if activeTab === 0}
					<div class="panel">
						<div class="field">
							<label for="background-upload">Wallpaper</label>
							<div class="image-upload">
								<input
									id="background-upload"
									type="file"
									accept="image/*"
									onchange={handleBackgroundUpload}
									class="file-input"
								/>
								{#if localConfig.backgroundImage}
									<div class="image-preview">
										<img src={localConfig.backgroundImage} alt="Wallpaper preview" />
										<span class="image-path">{localConfig.backgroundImage}</span>
										<button class="xp-btn remove" onclick={() => resetImage('background')}>
											Use default
										</button>
									</div>
								{:else}
									<span class="image-path">Using the bundled default wallpaper.</span>
								{/if}
							</div>
						</div>
						<div class="field">
							<label for="frame-content-upload">Sidebar Image</label>
							<div class="image-upload">
								<input
									id="frame-content-upload"
									type="file"
									accept="image/*"
									onchange={handleFrameContentUpload}
									class="file-input"
								/>
								{#if localConfig.frameContentImage}
									<div class="image-preview">
										<img src={localConfig.frameContentImage} alt="Sidebar preview" />
										<span class="image-path">{localConfig.frameContentImage}</span>
										<button class="xp-btn remove" onclick={() => resetImage('frameContent')}>
											Use default
										</button>
									</div>
								{:else}
									<span class="image-path">Using the bundled default sidebar image.</span>
								{/if}
							</div>
						</div>
					</div>
				{:else if activeTab === 1}
					<div class="panel">
						<div class="field">
							<label for="title-input">Title</label>
							<input id="title-input" type="text" bind:value={localConfig.title} class="xp-input" />
						</div>
						<div class="field">
							<label for="quote-input">Quote</label>
							<input id="quote-input" type="text" bind:value={localConfig.quote} class="xp-input" />
						</div>
						<div class="field">
							<label for="new-tab-input">Links</label>
							<label class="checkbox-label">
								<input
									id="new-tab-input"
									type="checkbox"
									bind:checked={localConfig.openInNewTab}
									class="xp-checkbox"
								/>
								Open links in a new tab
							</label>
						</div>
					</div>
				{:else if activeTab === 2}
					<div class="panel">
						<div class="section-header">
							<input
								type="text"
								bind:value={localConfig.quickAccess.title}
								class="xp-input section-title-input"
							/>
							<input
								type="text"
								bind:value={localConfig.quickAccess.icon}
								class="xp-input icon-input"
								maxlength="2"
							/>
						</div>
						<div class="items-list">
							{#each localConfig.quickAccess.items as item, i (i)}
								<div class="item-row">
									<input
										type="text"
										bind:value={item.name}
										class="xp-input name-input"
										placeholder="Name"
									/>
									<input
										type="text"
										bind:value={item.url}
										class="xp-input url-input"
										placeholder="URL"
									/>
									<input
										type="text"
										bind:value={item.shortcut}
										class="xp-input shortcut-input"
										placeholder="Key"
										maxlength="2"
									/>
									<button class="xp-btn remove" onclick={() => removeItem(0, i, true)}> × </button>
								</div>
							{/each}
							<button class="xp-btn add" onclick={() => addItem(0, true)}> + Add Item </button>
						</div>
					</div>
				{:else}
					{@const tabIdx = activeTab - 3}
					{@const tab = localConfig.tabs[tabIdx]}
					{#if tab}
						<div class="panel">
							<div class="tab-settings">
								<div class="field">
									<label for="tab-title-input">Tab Title</label>
									<input id="tab-title-input" type="text" bind:value={tab.title} class="xp-input" />
								</div>
								<div class="field">
									<label for="tab-icon-input">Tab Icon</label>
									<input
										id="tab-icon-input"
										type="text"
										bind:value={tab.icon}
										class="xp-input icon-input"
										maxlength="2"
									/>
								</div>
								<div class="tab-actions">
									<button
										class="xp-btn"
										onclick={() => moveTab(tabIdx, -1)}
										disabled={tabIdx === 0}
									>
										◀ Move Left
									</button>
									<button
										class="xp-btn"
										onclick={() => moveTab(tabIdx, 1)}
										disabled={tabIdx === localConfig.tabs.length - 1}
									>
										Move Right ▶
									</button>
									<button class="xp-btn danger" onclick={() => removeTab(tabIdx)}>
										Remove Tab
									</button>
								</div>
							</div>

							<div class="sections-container">
								{#each tab.sections as section, sIdx (sIdx)}
									<div class="section-block">
										<div class="section-header">
											<input
												type="text"
												bind:value={section.title}
												class="xp-input section-title-input"
												placeholder="Section Title"
											/>
											<input
												type="text"
												bind:value={section.icon}
												class="xp-input icon-input"
												placeholder="Icon"
												maxlength="2"
											/>
											<button class="xp-btn remove" onclick={() => removeSection(sIdx)}> × </button>
										</div>
										<div class="items-list">
											{#each section.items as item, i (i)}
												<div class="item-row">
													<input
														type="text"
														bind:value={item.name}
														class="xp-input name-input"
														placeholder="Name"
													/>
													<input
														type="text"
														bind:value={item.url}
														class="xp-input url-input"
														placeholder="URL"
													/>
													<input
														type="text"
														bind:value={item.shortcut}
														class="xp-input shortcut-input"
														placeholder="Key"
														maxlength="2"
													/>
													<button class="xp-btn remove" onclick={() => removeItem(sIdx, i)}>
														×
													</button>
												</div>
											{/each}
											<button class="xp-btn add" onclick={() => addItem(sIdx)}> + Add Item </button>
										</div>
									</div>
								{/each}
								<button class="xp-btn add" onclick={addSection}> + Add Section </button>
							</div>
						</div>
					{/if}
				{/if}
			</div>
		</div>

		<div class="status-bar">
			<div class="status-text" class:error={uploadError}>{uploadError || 'Ready'}</div>
		</div>

		<div class="button-bar">
			<button class="xp-btn primary" onclick={handleSave}>Save</button>
			<button class="xp-btn" onclick={onClose}>Cancel</button>
		</div>
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.window {
		position: absolute;
		width: 700px;
		height: 550px;
		background: #1a3a4a;
		border: 3px outset #2a5a6a;
		box-shadow:
			2px 2px 10px rgba(0, 0, 0, 0.5),
			inset 1px 1px 0 rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
		font-family: 'VT323', 'JetBrains Mono', monospace;
		font-size: 16px;
		color: #eee;
	}

	.title-bar {
		background: #084d6e;
		padding: 4px 6px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		cursor: move;
		user-select: none;
		border-bottom: 1px solid #053545;
	}

	.title-text {
		color: #00ffe5;
		font-weight: bold;
		font-size: 18px;
		text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
	}

	.title-buttons {
		display: flex;
		gap: 3px;
	}

	.title-btn {
		width: 24px;
		height: 24px;
		border: 1px outset #3a6a7a;
		background: #2a5a6a;
		font-size: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		padding: 0;
		color: #eee;
	}

	.title-btn:hover {
		background: #3a6a7a;
	}

	.title-btn.close {
		background: #8a3a3a;
		color: #fff;
		font-weight: bold;
		font-size: 18px;
	}

	.title-btn.close:hover {
		background: #aa4a4a;
	}

	.window-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border: 2px inset #2a5a6a;
		margin: 4px;
		margin-bottom: 0;
	}

	.tab-strip {
		display: flex;
		background: #1a3a4a;
		padding: 4px 4px 2px 4px;
		gap: 1px;
	}

	.tab {
		background: #1a3a4a;
		border: 1px outset #2a5a6a;
		border-bottom: none;
		padding: 6px 16px;
		font-size: 14px;
		cursor: pointer;
		margin-bottom: -1px;
		position: relative;
		top: 1px;
		color: #a2d2ff;
	}

	.tab.active {
		background: #1d78a7;
		border: 1px solid #3a8aae;
		border-bottom: 1px solid #1d78a7;
		color: #00ffe5;
		z-index: 1;
	}

	.tab.add-tab {
		padding: 6px 10px;
		font-weight: bold;
		color: #e8c170;
	}

	.tab-content {
		flex: 1;
		background: #1a3a4a;
		border: 1px solid #2a5a6a;
		margin: 4px;
		margin-top: 0;
		padding: 16px;
		overflow-y: auto;
		color: #eee;
	}

	.panel {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.field {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.field label {
		width: 140px;
		font-weight: bold;
		color: #e8c170;
	}

	.xp-input {
		border: 1px solid #3a6a7a;
		padding: 6px 8px;
		font-size: 14px;
		background: #0a2a3a;
		color: #eee;
		font-family: inherit;
	}

	.xp-input:focus {
		outline: none;
		border-color: #00ffe5;
	}

	.section-header {
		display: flex;
		gap: 8px;
		align-items: center;
		margin-bottom: 12px;
	}

	.section-title-input {
		flex: 1;
		font-weight: bold;
	}

	.icon-input {
		width: 40px;
		text-align: center;
	}

	.items-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-left: 16px;
	}

	.item-row {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.name-input {
		width: 140px;
	}

	.url-input {
		flex: 1;
	}

	.shortcut-input {
		width: 50px;
		text-align: center;
	}

	.xp-btn {
		border: 1px outset #3a6a7a;
		background: #2a5a6a;
		padding: 6px 14px;
		font-size: 14px;
		cursor: pointer;
		color: #eee;
		font-family: inherit;
	}

	.xp-btn:hover {
		background: #3a6a7a;
	}

	.xp-btn:active {
		border: 1px inset #3a6a7a;
	}

	.xp-btn.primary {
		background: #0a7a9e;
		color: #00ffe5;
	}

	.xp-btn.primary:hover {
		background: #0a8aae;
	}

	.xp-btn.add {
		margin-top: 8px;
		align-self: flex-start;
	}

	.xp-btn.remove {
		padding: 4px 8px;
		background: #4a2a2a;
		color: #ff8888;
	}

	.xp-btn.danger {
		background: #8a3a3a;
		color: #ff8888;
	}

	.xp-btn.danger:hover {
		background: #aa4a4a;
	}

	.tab-settings {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: flex-end;
		padding-bottom: 16px;
		border-bottom: 1px solid #2a5a6a;
		margin-bottom: 16px;
	}

	.tab-settings .field {
		flex-direction: column;
		align-items: flex-start;
	}

	.tab-actions {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.tab-actions .xp-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.sections-container {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.section-block {
		border: 1px solid #3a6a5a;
		padding: 12px;
		background: #0f2f3f;
	}

	.status-bar {
		border: 1px inset #2a5a6a;
		border-top: none;
		padding: 4px 8px;
		background: #1a3a4a;
		margin: 0 4px;
	}

	.status-text {
		color: #c0c0c0;
	}

	.status-text.error {
		color: #ff8888;
	}

	.button-bar {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		padding: 12px 16px;
		background: #1a3a4a;
		border-top: 1px solid #2a5a6a;
	}

	.field label.checkbox-label {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		color: #eee;
		font-weight: normal;
		width: auto;
	}

	.xp-checkbox {
		width: 16px;
		height: 16px;
		accent-color: #0a7a9e;
		cursor: pointer;
	}

	.image-upload {
		display: flex;
		flex-direction: column;
		gap: 8px;
		flex: 1;
	}

	.file-input {
		color: #eee;
		font-family: inherit;
	}

	.file-input::file-selector-button {
		background: #2a5a6a;
		border: 1px outset #3a6a7a;
		color: #eee;
		padding: 4px 12px;
		font-family: inherit;
		cursor: pointer;
	}

	.file-input::file-selector-button:hover {
		background: #3a6a7a;
	}

	.image-preview {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px;
		background: #0f2f3f;
		border: 1px solid #2a5a6a;
	}

	.image-preview img {
		width: 60px;
		height: 40px;
		object-fit: cover;
		border: 1px solid #3a6a7a;
	}

	.image-path {
		color: #00ffe5;
		font-size: 12px;
		word-break: break-all;
	}
</style>
