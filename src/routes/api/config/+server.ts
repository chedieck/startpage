import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readConfig, writeConfig } from '$lib/server/config';

export const GET: RequestHandler = async () => {
	const config = await readConfig();
	return json(config);
};

export const PUT: RequestHandler = async ({ request }) => {
	const config = await request.json();
	await writeConfig(config);
	return json({ ok: true });
};
