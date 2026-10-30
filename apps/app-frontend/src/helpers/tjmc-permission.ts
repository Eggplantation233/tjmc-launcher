import { invoke } from '@tauri-apps/api/core'

export type TjmcPermission = -1 | 0 | 1 | 2

export async function getTjmcPermission(): Promise<TjmcPermission | null> {
	const permission = await invoke<number | null>('plugin:auth|get_tjmc_permission')
	return isTjmcPermission(permission) ? permission : null
}

export function isTjmcPermission(value: unknown): value is TjmcPermission {
	return value === -1 || value === 0 || value === 1 || value === 2
}

export function isTjmcAdminPermission(value: unknown): value is 1 | 2 {
	return value === 1 || value === 2
}
