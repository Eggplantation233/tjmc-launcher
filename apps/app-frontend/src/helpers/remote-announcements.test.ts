import assert from 'node:assert/strict'
import test from 'node:test'

import { activeAnnouncements, type RemoteAnnouncement } from './remote-announcements.ts'

function announcement(
	id: string,
	published: string,
	starts: string,
	ends: string | null = null,
): RemoteAnnouncement {
	return {
		id,
		title: id,
		summary: null,
		content: id,
		type: 'notification',
		priority: 'normal',
		starts_at: starts,
		ends_at: ends,
		published_at: published,
		action_url: null,
		action_label: null,
	}
}

test('keeps every active announcement in newest-first order', () => {
	const now = Date.parse('2026-10-30T12:00:00Z')
	const active = activeAnnouncements(
		[
			announcement('older', '2026-10-28T12:00:00Z', '2026-10-28T12:00:00Z'),
			announcement('pending', '2026-10-31T12:00:00Z', '2026-10-31T12:00:00Z'),
			announcement('newest', '2026-10-30T10:00:00Z', '2026-10-30T10:00:00Z'),
			announcement(
				'expired',
				'2026-10-29T10:00:00Z',
				'2026-10-29T10:00:00Z',
				'2026-10-29T12:00:00Z',
			),
		],
		now,
	)

	assert.deepEqual(
		active.map((entry) => entry.id),
		['newest', 'older'],
	)
})
