import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { getImagesDir } from '$lib/server/config';

const SLOTS = ['background', 'frameContent'];
const EXTENSIONS: Record<string, string> = {
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	webp: 'image/webp',
	gif: 'image/gif'
};
const MAX_SIZE_10MB = 10 * 1024 * 1024;

/**
 * Uploads arrive as a raw body rather than a multipart form on purpose.
 * SvelteKit's CSRF guard rejects cross-origin form posts, but it can only
 * recognise a same-origin one when the server knows its own origin -- which
 * adapter-node does not unless ORIGIN is set, so multipart uploads 403 in a
 * production build. A raw `application/octet-stream` body sidesteps that and is
 * still safe: it is not a CORS-safelisted content type, so a browser has to
 * preflight it, and this app answers no preflight.
 */
export const POST: RequestHandler = async ({ request, url }) => {
	const slot = url.searchParams.get('slot');
	const ext = (url.searchParams.get('ext') ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

	if (!slot || !SLOTS.includes(slot)) {
		return error(400, 'Invalid slot. Use "background" or "frameContent".');
	}

	if (!EXTENSIONS[ext]) {
		return error(400, 'Unsupported file type. Use PNG, JPEG, WebP, or GIF.');
	}

	const body = Buffer.from(await request.arrayBuffer());

	if (body.byteLength === 0) {
		return error(400, 'Empty upload.');
	}

	if (body.byteLength > MAX_SIZE_10MB) {
		return error(400, 'File too large. Maximum 10MB.');
	}

	const filename = `${slot}.${ext}`;
	const imagesDir = getImagesDir();
	await mkdir(imagesDir, { recursive: true });

	// Drop whatever used to fill this slot under a different extension.
	try {
		const files = await readdir(imagesDir);
		for (const f of files) {
			if (f.startsWith(`${slot}.`) && f !== filename) {
				await unlink(join(imagesDir, f));
			}
		}
	} catch {
		// No images directory yet, or nothing to replace.
	}

	await writeFile(join(imagesDir, filename), body);

	return json({ path: `/api/images/${filename}?t=${Date.now()}` });
};
