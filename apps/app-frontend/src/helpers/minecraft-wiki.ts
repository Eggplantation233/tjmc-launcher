import { isTauri } from '@tauri-apps/api/core'
import { fetch as tauriFetch } from '@tauri-apps/plugin-http'

import { TjmcConfig } from '@/config'

export type MinecraftWikiRelease = {
	theme_name: string
	theme_url: string
	edition: string
	version: string
	version_url: string
	image_url: string
	image_dark_url: string | null
}

function safeWikiUrl(value: unknown): string | null {
	if (typeof value !== 'string') return null
	try {
		const url = new URL(value)
		return url.protocol === 'https:' &&
			url.hostname === 'zh.minecraft.wiki' &&
			!url.username &&
			!url.password
			? url.href
			: null
	} catch {
		return null
	}
}

export async function fetchLatestMinecraftWikiRelease(): Promise<MinecraftWikiRelease | null> {
	const href = TjmcConfig.minecraftWikiUrl
	if (!href) return null

	const response = isTauri()
		? await tauriFetch(href, { credentials: 'omit' })
		: await fetch(href, { credentials: 'omit' })
	if (response.status === 204) return null
	if (!response.ok) throw new Error(`Minecraft Wiki request failed: HTTP ${response.status}`)

	const payload = (await response.json()) as Record<string, unknown>
	const themeName = typeof payload.theme_name === 'string' ? payload.theme_name.trim() : ''
	const edition = typeof payload.edition === 'string' ? payload.edition.trim() : ''
	const version = typeof payload.version === 'string' ? payload.version.trim() : ''
	const themeUrl = safeWikiUrl(payload.theme_url)
	const versionUrl = safeWikiUrl(payload.version_url)
	const imageUrl = safeWikiUrl(payload.image_url)
	if (!themeName || edition !== 'Java版' || !version || !themeUrl || !versionUrl || !imageUrl) {
		return null
	}

	return {
		theme_name: themeName,
		theme_url: themeUrl,
		edition,
		version,
		version_url: versionUrl,
		image_url: imageUrl,
		image_dark_url: safeWikiUrl(payload.image_dark_url),
	}
}
