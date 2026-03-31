import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFile, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';

function getImagesDir(): string {
	return join(homedir(), '.config', 'startpage', 'images');
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_SIZE_10MB = 10 * 1024 * 1024;

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	const slot = formData.get('slot') as string | null;

	if (!file || !slot) {
		return error(400, 'Missing file or slot parameter');
	}

	if (!ALLOWED_TYPES.includes(file.type)) {
		return error(400, 'Unsupported file type. Use PNG, JPEG, WebP, or GIF.');
	}

	if (file.size > MAX_SIZE_10MB) {
		return error(400, 'File too large. Maximum 10MB.');
	}

	if (!['background', 'frameContent'].includes(slot)) {
		return error(400, 'Invalid slot. Use "background" or "frameContent".');
	}

	const ext = file.name.split('.').pop() || 'png';
	const filename = `${slot}.${ext}`;
	const imagesDir = getImagesDir();
	await mkdir(imagesDir, { recursive: true });

	const buffer = Buffer.from(await file.arrayBuffer());
	await writeFile(join(imagesDir, filename), buffer);

	return json({ path: `/api/images/${filename}` });
};

export const GET: RequestHandler = async ({ url }) => {
	const filename = url.searchParams.get('file');
	if (!filename) {
		return error(400, 'Missing file parameter');
	}

	const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '');
	const filePath = join(getImagesDir(), safe);

	if (!existsSync(filePath)) {
		return error(404, 'Image not found');
	}

	const data = readFileSync(filePath);
	const ext = safe.split('.').pop()?.toLowerCase();
	const mimeMap: Record<string, string> = {
		png: 'image/png',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		webp: 'image/webp',
		gif: 'image/gif'
	};

	return new Response(data, {
		headers: {
			'Content-Type': mimeMap[ext ?? ''] || 'application/octet-stream',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
