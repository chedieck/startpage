import { readConfig } from '$lib/server/config';
import { resolveConfig } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const config = await readConfig();
	const resolved = resolveConfig(config);
	return {
		config,
		resolved
	};
};
