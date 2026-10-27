import { isTauri } from '@tauri-apps/api/core'
import { fetch as tauriFetch } from '@tauri-apps/plugin-http'

import { TjmcConfig } from '@/config'
import {
	chooseNotification,
	parseNotifications,
	type RemoteNotification,
} from '@/helpers/remote-notifications-core'

const MAX_NOTIFICATION_PAYLOAD_LENGTH = 131_072

export { chooseNotification, parseNotifications, type RemoteNotification }

async function fetchNotifications(): Promise<RemoteNotification[]> {
	const href = TjmcConfig.notificationsUrl
	if (!href) return []

	try {
		const response = isTauri()
			? await tauriFetch(href, { credentials: 'omit' })
			: await fetch(href, { credentials: 'omit' })
		if (!response.ok) return []

		const text = await response.text()
		if (text.length > MAX_NOTIFICATION_PAYLOAD_LENGTH) return []
		const payload = JSON.parse(text) as unknown
		return parseNotifications(
			Array.isArray(payload)
				? payload
				: (payload as { notifications?: unknown } | null)?.notifications,
		)
	} catch {
		return []
	}
}

let startupNotification: Promise<RemoteNotification | null> | null = null

/**
 * Fetches and selects once per launcher process. Remounting Home therefore keeps
 * the same line until the application is started again.
 */
export function getStartupNotification(): Promise<RemoteNotification | null> {
	startupNotification ??= fetchNotifications().then((notifications) =>
		chooseNotification(notifications),
	)
	return startupNotification
}
