import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';

function getImagesDir(): string {
	return join(homedir(), '.config', 'startpage', 'images');
}

const MIME_MAP: Record<string, string> = {
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	webp: 'image/webp',
	gif: 'image/gif'
};

export const GET: RequestHandler = async ({ params }) => {
	const filename = params.filename;
	if (!filename) {
		return error(400, 'Missing filename');
	}

	const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '');
	const filePath = join(getImagesDir(), safe);

	if (!existsSync(filePath)) {
		return error(404, 'Image not found');
	}

	const data = readFileSync(filePath);
	const ext = safe.split('.').pop()?.toLowerCase();

	return new Response(data, {
		headers: {
			'Content-Type': MIME_MAP[ext ?? ''] || 'application/octet-stream',
			'Cache-Control': 'no-cache'
		}
	});
};
