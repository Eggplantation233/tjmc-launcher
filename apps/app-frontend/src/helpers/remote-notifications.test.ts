import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
	chooseNotification,
	parseNotifications,
	type RemoteNotification,
} from './remote-notifications-core.ts'

test('parseNotifications keeps valid unique entries', () => {
	const parsed = parseNotifications([
		{ id: 'one', content: '第一条通知' },
		{ id: 'one', content: '重复标识' },
		{ id: 'two', content: ' 第二条通知 ' },
		{ id: '', content: '空标识' },
	])

	assert.deepEqual(parsed, [
		{ id: 'one', content: '第一条通知' },
		{ id: 'two', content: '第二条通知' },
	])
})

test('chooseNotification selects one item and handles an empty list', () => {
	const items: RemoteNotification[] = [
		{ id: 'one', content: '第一条' },
		{ id: 'two', content: '第二条' },
	]

	assert.equal(chooseNotification(items, () => 0)?.id, 'one')
	assert.equal(chooseNotification(items, () => 0.999)?.id, 'two')
	assert.equal(
		chooseNotification([], () => 0.5),
		null,
	)
})
