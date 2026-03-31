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
		tabs: []
	});

	let activeTab = $state(0);
	let windowX = $state(0);
	let windowY = $state(0);
	let isDragging = $state(false);
	let dragOffsetX = $state(0);
	let dragOffsetY = $state(0);

	const tabLabels = $derived(['General', 'Quick Access', ...localConfig.tabs.map((t) => t.title)]);

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
			const tabIdx = activeTab - 2;
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
			const tabIdx = activeTab - 2;
			if (tabIdx >= 0 && localConfig.tabs[tabIdx]) {
				localConfig.tabs[tabIdx].sections[sectionIndex].items = localConfig.tabs[tabIdx].sections[
					sectionIndex
				].items.filter((_, i) => i !== itemIndex);
			}
		}
	}

	function addSection() {
		const tabIdx = activeTab - 2;
		if (tabIdx >= 0 && localConfig.tabs[tabIdx]) {
			const newSection: Section = { title: 'New Section', icon: '📁', items: [] };
			localConfig.tabs[tabIdx].sections = [...localConfig.tabs[tabIdx].sections, newSection];
		}
	}

	function removeSection(sectionIndex: number) {
		const tabIdx = activeTab - 2;
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
				{#if activeTab >= 2}
					<button class="tab add-tab" onclick={addTab}>+</button>
				{/if}
			</div>

			<div class="tab-content">
				{#if activeTab === 0}
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
				{:else if activeTab === 1}
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
					{@const tabIdx = activeTab - 2}
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
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.window {
		position: absolute;
		width: 700px;
		height: 550px;
		background: #ece9d8;
		border: 3px outset #c0c0c0;
		box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.5);
		display: flex;
		flex-direction: column;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		font-size: 12px;
	}

	.title-bar {
		background: linear-gradient(90deg, #0058ee 0%, #3593ff 50%, #0058ee 100%);
		padding: 3px 4px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		cursor: move;
		user-select: none;
	}

	.title-text {
		color: white;
		font-weight: bold;
		font-size: 13px;
		text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
	}

	.title-buttons {
		display: flex;
		gap: 2px;
	}

	.title-btn {
		width: 21px;
		height: 21px;
		border: 1px outset #c0c0c0;
		background: linear-gradient(180deg, #ece9d8 0%, #c0c0c0 100%);
		font-size: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		padding: 0;
	}

	.title-btn.close {
		background: linear-gradient(180deg, #e06b6b 0%, #c42b2b 100%);
		color: white;
		font-weight: bold;
		font-size: 14px;
	}

	.title-btn.close:hover {
		background: linear-gradient(180deg, #ff8585 0%, #e84545 100%);
	}

	.window-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border: 2px inset #c0c0c0;
		margin: 4px;
		margin-bottom: 0;
	}

	.tab-strip {
		display: flex;
		background: #ece9d8;
		padding: 4px 4px 0 4px;
		gap: 1px;
	}

	.tab {
		background: linear-gradient(180deg, #ece9d8 0%, #c0c0c0 100%);
		border: 1px outset #c0c0c0;
		border-bottom: none;
		padding: 4px 12px;
		font-size: 12px;
		cursor: pointer;
		margin-bottom: -1px;
		position: relative;
		top: 1px;
	}

	.tab.active {
		background: #fff;
		border: 1px solid #c0c0c0;
		border-bottom: 1px solid #fff;
		z-index: 1;
	}

	.tab.add-tab {
		padding: 4px 8px;
		font-weight: bold;
	}

	.tab-content {
		flex: 1;
		background: #fff;
		border: 1px solid #c0c0c0;
		margin: 4px;
		margin-top: 0;
		padding: 12px;
		overflow-y: auto;
	}

	.panel {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.field {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.field label {
		width: 80px;
		font-weight: bold;
	}

	.xp-input {
		border: 1px solid #7f9db9;
		padding: 2px 4px;
		font-size: 12px;
		background: #fff;
	}

	.xp-input:focus {
		outline: none;
		border-color: #0058ee;
	}

	.section-header {
		display: flex;
		gap: 8px;
		align-items: center;
		margin-bottom: 8px;
	}

	.section-title-input {
		flex: 1;
		font-weight: bold;
	}

	.icon-input {
		width: 30px;
		text-align: center;
	}

	.items-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-left: 16px;
	}

	.item-row {
		display: flex;
		gap: 4px;
		align-items: center;
	}

	.name-input {
		width: 120px;
	}

	.url-input {
		flex: 1;
	}

	.shortcut-input {
		width: 40px;
		text-align: center;
	}

	.xp-btn {
		border: 1px outset #c0c0c0;
		background: linear-gradient(180deg, #ece9d8 0%, #c0c0c0 100%);
		padding: 4px 12px;
		font-size: 12px;
		cursor: pointer;
	}

	.xp-btn:hover {
		background: linear-gradient(180deg, #f5f5f5 0%, #d0d0d0 100%);
	}

	.xp-btn:active {
		border: 1px inset #c0c0c0;
	}

	.xp-btn.primary {
		background: linear-gradient(180deg, #0058ee 0%, #0046be 100%);
		color: white;
	}

	.xp-btn.primary:hover {
		background: linear-gradient(180deg, #1a6eff 0%, #0058ee 100%);
	}

	.xp-btn.add {
		margin-top: 4px;
		align-self: flex-start;
	}

	.xp-btn.remove {
		padding: 2px 6px;
		background: linear-gradient(180deg, #e8e8e8 0%, #c0c0c0 100%);
	}

	.xp-btn.danger {
		background: linear-gradient(180deg, #e06b6b 0%, #c42b2b 100%);
		color: white;
	}

	.xp-btn.danger:hover {
		background: linear-gradient(180deg, #ff8585 0%, #e84545 100%);
	}

	.tab-settings {
		display: flex;
		gap: 12px;
		align-items: flex-end;
		padding-bottom: 12px;
		border-bottom: 1px solid #c0c0c0;
		margin-bottom: 12px;
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
		border: 1px inset #c0c0c0;
		padding: 8px;
		background: #f5f5f5;
	}

	.status-bar {
		border: 1px inset #c0c0c0;
		border-top: none;
		padding: 2px 4px;
		background: #ece9d8;
		margin: 0 4px;
	}

	.status-text {
		color: #444;
	}

	.button-bar {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		padding: 8px 12px;
		background: #ece9d8;
		border-top: 1px solid #c0c0c0;
	}
</style>
