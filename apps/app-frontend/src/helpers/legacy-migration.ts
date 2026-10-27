import { invoke } from '@tauri-apps/api/core'

/**
 * First-start copy of data from SITMC, with upstream Axolotl as a fallback.
 *
 * The identifier changed with the rebrand, so an existing installation's data
 * lives in the directory keyed by the old identifier. The boot screen waits for
 * the copy before opening TJMC's database; the source data stays in place.
 */
export async function legacyMigrationPending(): Promise<boolean> {
	return await invoke<boolean>('legacy_migration_pending')
}

export async function runLegacyMigration(): Promise<void> {
	return await invoke<void>('legacy_migrate')
}
