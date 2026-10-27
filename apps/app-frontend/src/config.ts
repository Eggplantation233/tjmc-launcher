const trimTrailingSlash = (url: string) => url.replace(/\/$/, '')

export const AxolotlBrandConfig = Object.freeze({
	productName: 'TJMC Launcher',
	shortProductName: 'TJMC',
	societyName: 'TJMC',
	website: 'https://www.sitmc.club/',
	repositoryUrl: 'https://github.com/SIT-Minecraft-Axolotl-Club/Axolotl',
	// The AGPL LICENSE text only exists upstream; the society fork carries COPYING.md
	// and the third-party attributions that the About page links to as well.
	upstreamRepositoryUrl: 'https://github.com/Mystic-Stars/Axolotl',
	supportUrl: 'https://qm.qq.com/q/YTb3tqvyYE',
	qqGroupNumber: '623697015',
	qqChannelUrl: '',
	sponsorUrl: '',
	surveyUrl: '',
	bundleIdentifier: 'club.tjmc.launcher',
	deepLinkScheme: 'tjmc',
	userAgent: (version: string, os: string) => `tjmc-launcher/${version} (${os})`,
	capabilities: Object.freeze({
		publicModrinthApi: true,
		privateModrinthServices: false,
		ghsTelemetry: false,
	}),
})

const siteUrl = trimTrailingSlash(import.meta.env.MODRINTH_URL || 'https://modrinth.com')
const officialLabrinthBaseUrl = trimTrailingSlash(
	import.meta.env.MODRINTH_API_BASE_URL || 'https://api.modrinth.com',
)
type DownloadSourceMode = 'auto' | 'official_only' | 'mirror_preferred' | 'official_preferred'

// The Modrinth API always uses the official source; Modrinth download mirror
// routing is handled by the Rust download layer.
export function setModrinthSourceMode(_sourceMode: DownloadSourceMode) {}

export function setModrinthMirrorEnabled(_enabled: boolean) {}

export function getOfficialLabrinthBaseUrl() {
	return officialLabrinthBaseUrl
}

export function getLabrinthBaseUrl() {
	return officialLabrinthBaseUrl
}

export const config = {
	siteUrl,
	labrinthBaseUrl: getLabrinthBaseUrl,
}

/**
 * The society services this build talks to.
 *
 * Accounts live on the society's Blessing Skin site and nowhere else, and the game
 * instances come from the server-side catalog described in
 * `docs/launcher-protocol.md`. The service addresses are baked in here so a plain
 * `pnpm app:build` produces a working society build; each `VITE_TJMC_*` variable
 * still overrides its default, and setting one to an empty string disables that
 * feature instead of reaching for another community's server.
 */
const DEFAULT_MANIFEST_URL = 'https://skin.tongji-mc.cn/api/launcher/manifest'
const DEFAULT_FRIENDS_URL = 'https://skin.tongji-mc.cn/api/launcher/friends'
const DEFAULT_FRIENDS_INTEROP_URL = 'https://skin.tongji-mc.cn/api/launcher/interop/v1/friends'
const DEFAULT_ANNOUNCEMENTS_URL = 'https://skin.tongji-mc.cn/api/launcher/announcements'
const DEFAULT_NOTIFICATIONS_URL = 'https://skin.tongji-mc.cn/api/launcher/notifications'
const DEFAULT_MINECRAFT_WIKI_URL = 'https://skin.tongji-mc.cn/api/launcher/wiki/latest'
const DEFAULT_UPDATE_URL = 'https://skin.tongji-mc.cn/api/launcher/update'

const manifestUrl = (import.meta.env.VITE_TJMC_MANIFEST_URL ?? DEFAULT_MANIFEST_URL).trim()
const friendsUrl = (import.meta.env.VITE_TJMC_FRIENDS_URL ?? DEFAULT_FRIENDS_URL).trim()
const friendsInteropUrl = (
	import.meta.env.VITE_TJMC_FRIENDS_INTEROP_URL ?? DEFAULT_FRIENDS_INTEROP_URL
).trim()
const announcementsUrl = (
	import.meta.env.VITE_TJMC_ANNOUNCEMENTS_URL ??
	import.meta.env.VITE_AXO_ANNOUNCEMENTS_URL ??
	DEFAULT_ANNOUNCEMENTS_URL
).trim()
const notificationsUrl = (
	import.meta.env.VITE_TJMC_NOTIFICATIONS_URL ?? DEFAULT_NOTIFICATIONS_URL
).trim()
const minecraftWikiUrl = (
	import.meta.env.VITE_TJMC_MINECRAFT_WIKI_URL ?? DEFAULT_MINECRAFT_WIKI_URL
).trim()
const updateUrl = (import.meta.env.VITE_TJMC_UPDATE_URL ?? DEFAULT_UPDATE_URL).trim()

export const TjmcConfig = Object.freeze({
	serverLabel: 'TJMC',
	site: 'https://skin.tongji-mc.cn',
	skinLibraryUrl: 'https://skin.tongji-mc.cn/skinlib',
	registerUrl: 'https://skin.tongji-mc.cn/auth/register',
	loginUrl: 'https://skin.tongji-mc.cn/auth/login',
	apiRoot: 'https://skin.tongji-mc.cn/api/yggdrasil',
	officialSite: 'https://www.sitmc.club/',
	privacyUrl: 'https://www.sitmc.club/privacy',
	manifestUrl: trimTrailingSlash(manifestUrl),
	/** Friend-site catalog, grouped by source site. */
	friendsUrl: trimTrailingSlash(friendsUrl),
	/** Versioned mirror of the same friend catalog. */
	friendsInteropUrl: trimTrailingSlash(friendsInteropUrl),
	announcementsUrl: trimTrailingSlash(announcementsUrl),
	notificationsUrl: trimTrailingSlash(notificationsUrl),
	minecraftWikiUrl: trimTrailingSlash(minecraftWikiUrl),
	updateUrl: trimTrailingSlash(updateUrl),
})
