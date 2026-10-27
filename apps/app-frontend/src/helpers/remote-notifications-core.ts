export type RemoteNotification = {
	id: string
	content: string
}

export function parseNotifications(value: unknown): RemoteNotification[] {
	if (!Array.isArray(value) || value.length > 200) return []

	const ids = new Set<string>()
	const notifications: RemoteNotification[] = []

	for (const entry of value) {
		if (!entry || typeof entry !== 'object') continue
		const item = entry as Record<string, unknown>
		if (
			typeof item.id !== 'string' ||
			!item.id.trim() ||
			item.id.length > 100 ||
			ids.has(item.id) ||
			typeof item.content !== 'string' ||
			!item.content.trim() ||
			item.content.length > 300
		)
			continue

		ids.add(item.id)
		notifications.push({ id: item.id, content: item.content.trim() })
	}

	return notifications
}

export function chooseNotification(
	notifications: readonly RemoteNotification[],
	random: () => number = Math.random,
): RemoteNotification | null {
	if (!notifications.length) return null
	const index = Math.min(notifications.length - 1, Math.floor(random() * notifications.length))
	return notifications[Math.max(0, index)] ?? null
}
