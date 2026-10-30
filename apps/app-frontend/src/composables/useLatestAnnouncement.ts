import { getVersion } from '@tauri-apps/api/app'
import { computed, ref } from 'vue'

import { TjmcConfig } from '@/config'
import {
	activeAnnouncements,
	announcementItems,
	fetchAnnouncementPayload,
	parseAnnouncements,
	type RemoteAnnouncement,
} from '@/helpers/remote-announcements'
import { getUpdateChannel } from '@/helpers/settings'

const CACHE_TTL_MS = 30 * 60 * 1000
const MEMO_TTL_MS = 60 * 1000
const REQUEST_TIMEOUT_MS = 10 * 1000

let endpoint: string | null = null
let memo: { at: number; items: RemoteAnnouncement[] } | null = null
let inFlight: Promise<RemoteAnnouncement[] | null> | null = null

function cacheKey(href: string) {
	return `axolotl-home-announcement:${href}`
}

async function resolveEndpoint(): Promise<string | null> {
	if (endpoint) return endpoint
	if (!TjmcConfig.announcementsUrl) return null

	const url = new URL(TjmcConfig.announcementsUrl)
	try {
		const [version, channel] = await Promise.all([getVersion(), getUpdateChannel()])
		url.searchParams.set('version', version)
		url.searchParams.set('channel', channel === 'release' ? 'stable' : 'beta')
	} catch {
		// Outside the desktop shell the app version is unavailable; the endpoint still answers.
	}
	endpoint = url.href
	return endpoint
}

function readCache(href: string): RemoteAnnouncement[] | null {
	try {
		const cached = JSON.parse(localStorage.getItem(cacheKey(href)) ?? 'null')
		if (
			cached &&
			typeof cached.savedAt === 'number' &&
			Date.now() - cached.savedAt < CACHE_TTL_MS
		) {
			return parseAnnouncements(cached.items)
		}
	} catch {
		// Ignore unreadable caches.
	}
	return null
}

function writeCache(href: string, items: RemoteAnnouncement[]) {
	try {
		localStorage.setItem(cacheKey(href), JSON.stringify({ savedAt: Date.now(), items }))
	} catch {
		// Ignore cache write failures.
	}
}

async function load(): Promise<RemoteAnnouncement[] | null> {
	if (memo && Date.now() - memo.at < MEMO_TTL_MS) return memo.items
	if (inFlight) return inFlight

	const href = await resolveEndpoint()
	if (!href) return null
	const cached = readCache(href)

	const request = (async () => {
		const abort = new AbortController()
		const timeout = setTimeout(() => abort.abort(), REQUEST_TIMEOUT_MS)
		try {
			const payload = await fetchAnnouncementPayload(href, abort.signal)
			if (payload === null) return cached
			const parsed = parseAnnouncements(announcementItems(payload))
			if (!parsed) return cached
			memo = { at: Date.now(), items: parsed }
			writeCache(href, parsed)
			return parsed
		} catch {
			return cached
		} finally {
			clearTimeout(timeout)
			inFlight = null
		}
	})()

	inFlight = request
	return request
}

export function useLatestAnnouncement() {
	const announcements = ref<RemoteAnnouncement[]>([])
	const currentIndex = ref(0)
	const loading = ref(true)
	const announcement = computed(() => announcements.value[currentIndex.value] ?? null)
	const canGoPrevious = computed(() => currentIndex.value > 0)
	const canGoNext = computed(() => currentIndex.value + 1 < announcements.value.length)

	function apply(items: RemoteAnnouncement[] | null) {
		const previousId = announcement.value?.id
		announcements.value = activeAnnouncements(items ?? [])
		const previousIndex = previousId
			? announcements.value.findIndex((entry) => entry.id === previousId)
			: -1
		currentIndex.value = previousIndex >= 0 ? previousIndex : 0
	}

	function previous() {
		if (canGoPrevious.value) currentIndex.value -= 1
	}

	function next() {
		if (canGoNext.value) currentIndex.value += 1
	}

	async function refresh() {
		loading.value = true
		try {
			apply(await load())
		} finally {
			loading.value = false
		}
	}

	return {
		announcement,
		announcements,
		currentIndex,
		canGoPrevious,
		canGoNext,
		previous,
		next,
		loading,
		refresh,
	}
}
