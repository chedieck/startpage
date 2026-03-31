<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<svelte:head>
	<link rel="preload" as="image" href="/background.png" />
	<link rel="preload" as="image" href="/window-frame.png" />
	<link rel="preload" as="image" href="/window-content.png" />
</svelte:head>

{@render children()}
