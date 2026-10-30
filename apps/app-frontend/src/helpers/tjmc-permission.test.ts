import assert from 'node:assert/strict'
import test from 'node:test'

import { isTjmcAdminPermission, isTjmcPermission } from './tjmc-permission.ts'

test('recognizes every skin site permission value', () => {
	for (const permission of [-1, 0, 1, 2]) {
		assert.equal(isTjmcPermission(permission), true)
	}
	assert.equal(isTjmcPermission(-2), false)
	assert.equal(isTjmcPermission(3), false)
	assert.equal(isTjmcPermission(null), false)
})

test('allows local modpack imports only for administrator levels', () => {
	assert.equal(isTjmcAdminPermission(-1), false)
	assert.equal(isTjmcAdminPermission(0), false)
	assert.equal(isTjmcAdminPermission(1), true)
	assert.equal(isTjmcAdminPermission(2), true)
	assert.equal(isTjmcAdminPermission(3), false)
})
