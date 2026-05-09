import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

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

	try {
		const files = await readdir(imagesDir);
		for (const f of files) {
			if (f.startsWith(`${slot}.`) && f !== filename) {
				await unlink(join(imagesDir, f));
			}
		}
	} catch {}

	const buffer = Buffer.from(await file.arrayBuffer());
	await writeFile(join(imagesDir, filename), buffer);

	return json({ path: `/api/images/${filename}?t=${Date.now()}` });
};
