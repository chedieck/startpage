import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import type { StartpageConfig } from '$lib/types';
import defaultConfig from '$lib/default-config.json';

/** Where config.json lives. Override with the STARTPAGE_CONFIG env var. */
export function getConfigPath(): string {
	return process.env.STARTPAGE_CONFIG || join(homedir(), '.config', 'startpage', 'config.json');
}

/** Uploaded images live next to config.json, in an `images/` subdirectory. */
export function getImagesDir(): string {
	return join(dirname(getConfigPath()), 'images');
}

export async function readConfig(): Promise<StartpageConfig> {
	const configPath = getConfigPath();

	if (!existsSync(configPath)) {
		await mkdir(dirname(configPath), { recursive: true });
		await writeFile(configPath, JSON.stringify(defaultConfig, null, '\t'), 'utf-8');
		return defaultConfig as StartpageConfig;
	}

	try {
		const raw = await readFile(configPath, 'utf-8');
		return JSON.parse(raw) as StartpageConfig;
	} catch {
		return defaultConfig as StartpageConfig;
	}
}

export async function writeConfig(config: StartpageConfig): Promise<void> {
	const configPath = getConfigPath();
	await mkdir(dirname(configPath), { recursive: true });
	await writeFile(configPath, JSON.stringify(config, null, '\t'), 'utf-8');
}
