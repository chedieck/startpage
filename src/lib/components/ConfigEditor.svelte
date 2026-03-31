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
		frameContentImage: undefined
	});

	let activeTab = $state(0);
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
		localConfig = deepClone(config);
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
	}

	function removeTab(tabIndex: number) {
		localConfig.tabs = localConfig.tabs.filter((_, i) => i !== tabIndex);
	}

	async function uploadImage(file: File, slot: 'background' | 'frameContent') {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('slot', slot);

		const response = await fetch('/api/images', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			const result = await response.json();
			if (slot === 'background') {
				localConfig.backgroundImage = result.path;
			} else {
				localConfig.frameContentImage = result.path;
			}
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

	function handleSave() {
		onSave(localConfig);
	}
</script>

<svelte:window onkeydown={handleKeydown} onmousemove={handleDrag} onmouseup={stopDrag} />

<div
	class="backdrop"
	onclick={handleBackdropClick}
	role="dialog"
	aria-modal="true"
	aria-labelledby="window-title"
>
	<div class="window" style="left: {windowX}px; top: {windowY}px;" role="document">
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
				{#if activeTab >= 3}
					<button class="tab add-tab" onclick={addTab}>+</button>
				{/if}
			</div>

			<div class="tab-content">
				{#if activeTab === 0}
					<div class="panel">
						<div class="field">
							<label>Background Image</label>
							<div class="image-upload">
								<input
									type="file"
									accept="image/*"
									onchange={handleBackgroundUpload}
									class="file-input"
								/>
								{#if localConfig.backgroundImage}
									<div class="image-preview">
										<img src={localConfig.backgroundImage} alt="Background preview" />
										<span class="image-path">{localConfig.backgroundImage}</span>
									</div>
								{/if}
							</div>
						</div>
						<div class="field">
							<label>Frame Content Image</label>
							<div class="image-upload">
								<input
									type="file"
									accept="image/*"
									onchange={handleFrameContentUpload}
									class="file-input"
								/>
								{#if localConfig.frameContentImage}
									<div class="image-preview">
										<img src={localConfig.frameContentImage} alt="Frame content preview" />
										<span class="image-path">{localConfig.frameContentImage}</span>
									</div>
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
									<label>Tab Title</label>
									<input type="text" bind:value={tab.title} class="xp-input" />
								</div>
								<div class="field">
									<label>Tab Icon</label>
									<input
										type="text"
										bind:value={tab.icon}
										class="xp-input icon-input"
										maxlength="2"
									/>
								</div>
								<button class="xp-btn danger" onclick={() => removeTab(tabIdx)}>
									Remove Tab
								</button>
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
			<div class="status-text">Ready</div>
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
		background: linear-gradient(180deg, #0a5a7e 0%, #084d6e 50%, #064058 100%);
		padding: 4px 6px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		cursor: move;
		user-select: none;
		border-bottom: 1px solid #053545;
	}

	.title-text {
		color: #eee;
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
		background: linear-gradient(180deg, #2a5a6a 0%, #1a4a5a 100%);
		font-size: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		padding: 0;
		color: #eee;
	}

	.title-btn:hover {
		background: linear-gradient(180deg, #3a6a7a 0%, #2a5a6a 100%);
	}

	.title-btn.close {
		background: linear-gradient(180deg, #8a3a3a 0%, #6a2a2a 100%);
		color: #fff;
		font-weight: bold;
		font-size: 18px;
	}

	.title-btn.close:hover {
		background: linear-gradient(180deg, #aa4a4a 0%, #8a3a3a 100%);
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
		padding: 4px 4px 0 4px;
		gap: 1px;
	}

	.tab {
		background: linear-gradient(180deg, #1a3a4a 0%, #0a2a3a 100%);
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
		background: linear-gradient(180deg, #2176a2 0%, #1a5a7e 100%);
		border: 1px solid #3a8aae;
		border-bottom: 1px solid #2176a2;
		color: #00ffe5;
		z-index: 1;
	}

	.tab.add-tab {
		padding: 6px 10px;
		font-weight: bold;
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
		color: #a2d2ff;
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
		background: linear-gradient(180deg, #2a5a6a 0%, #1a4a5a 100%);
		padding: 6px 14px;
		font-size: 14px;
		cursor: pointer;
		color: #eee;
		font-family: inherit;
	}

	.xp-btn:hover {
		background: linear-gradient(180deg, #3a6a7a 0%, #2a5a6a 100%);
	}

	.xp-btn:active {
		border: 1px inset #3a6a7a;
	}

	.xp-btn.primary {
		background: linear-gradient(180deg, #0a7a9e 0%, #084d6e 100%);
		color: #00ffe5;
	}

	.xp-btn.primary:hover {
		background: linear-gradient(180deg, #0a8aae 0%, #0a5d7e 100%);
	}

	.xp-btn.add {
		margin-top: 8px;
		align-self: flex-start;
	}

	.xp-btn.remove {
		padding: 4px 8px;
		background: linear-gradient(180deg, #4a2a2a 0%, #3a1a1a 100%);
		color: #ff8888;
	}

	.xp-btn.danger {
		background: linear-gradient(180deg, #8a3a3a 0%, #6a2a2a 100%);
		color: #ff8888;
	}

	.xp-btn.danger:hover {
		background: linear-gradient(180deg, #aa4a4a 0%, #8a3a3a 100%);
	}

	.tab-settings {
		display: flex;
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

	.sections-container {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.section-block {
		border: 1px inset #2a5a6a;
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
		color: #a2d2ff;
	}

	.button-bar {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		padding: 12px 16px;
		background: #1a3a4a;
		border-top: 1px solid #2a5a6a;
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
		background: linear-gradient(180deg, #2a5a6a 0%, #1a4a5a 100%);
		border: 1px outset #3a6a7a;
		color: #eee;
		padding: 4px 12px;
		font-family: inherit;
		cursor: pointer;
	}

	.file-input::file-selector-button:hover {
		background: linear-gradient(180deg, #3a6a7a 0%, #2a5a6a 100%);
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
