<script setup lang="ts">
import {
	GameIcon,
	PencilIcon,
	RefreshCwIcon,
	ServerIcon,
	SignalIcon,
	UsersIcon,
} from '@modrinth/assets'
import {
	Avatar,
	ButtonStyled,
	commonMessages,
	defineMessages,
	NewModal,
	StyledInput,
	useVIntl,
} from '@modrinth/ui'
import { autoToHTML } from '@sfirew/minecraft-motd-parser'
import { computed, onMounted, reactive, ref } from 'vue'

import type { HomeWidgetSize } from '@/components/home/home-dashboard'
import { normalizeServerInfoAddresses } from '@/components/home/home-dashboard'
import { get_server_status, type ServerStatus } from '@/helpers/worlds'

const props = defineProps<{
	addresses: string[]
	dashboardSize?: HomeWidgetSize | null
}>()

const emit = defineEmits<{
	updateAddresses: [addresses: string[]]
}>()

type ServerViewState = {
	refreshing: boolean
	status?: ServerStatus
	renderedMotd?: string
	failed: boolean
}

const { formatMessage } = useVIntl()
const modal = ref<InstanceType<typeof NewModal>>()
const draft = ref('')
const states = reactive<Record<string, ServerViewState>>({})
const refreshing = computed(() => props.addresses.some((address) => stateFor(address).refreshing))

const messages = defineMessages({
	title: { id: 'app.home.server-info.title', defaultMessage: 'Server status' },
	refresh: { id: 'app.home.server-info.refresh', defaultMessage: 'Refresh servers' },
	settings: { id: 'app.home.server-info.settings', defaultMessage: 'Edit servers' },
	settingsTitle: {
		id: 'app.home.server-info.settings-title',
		defaultMessage: 'Minecraft servers',
	},
	settingsHint: {
		id: 'app.home.server-info.settings-hint',
		defaultMessage: 'Enter one server address per line.',
	},
	empty: { id: 'app.home.server-info.empty', defaultMessage: 'No servers configured.' },
	offline: { id: 'app.home.server-info.offline', defaultMessage: 'Unable to query' },
	unknown: { id: 'app.home.server-info.unknown', defaultMessage: 'Unknown' },
	players: {
		id: 'app.home.server-info.players',
		defaultMessage: '{online}/{max} players',
	},
	latency: { id: 'app.home.server-info.latency', defaultMessage: '{ping} ms' },
})

function stateFor(address: string): ServerViewState {
	return (states[address] ??= {
		refreshing: false,
		failed: false,
	})
}

async function refreshAddress(address: string) {
	const state = stateFor(address)
	state.refreshing = true
	state.failed = false

	try {
		const status = await get_server_status(address)
		state.status = status
		state.renderedMotd = status.description ? autoToHTML(status.description) : undefined
		state.failed = false
	} catch {
		state.status = undefined
		state.renderedMotd = undefined
		state.failed = true
	} finally {
		state.refreshing = false
	}
}

async function refreshAll() {
	if (refreshing.value) return
	await Promise.all(props.addresses.map((address) => refreshAddress(address)))
}

function showSettings() {
	draft.value = props.addresses.join('\n')
	modal.value?.show()
}

function saveSettings() {
	emit('updateAddresses', normalizeServerInfoAddresses(draft.value.split(/[\n,;]+/)))
	modal.value?.hide()
}

onMounted(() => {
	void refreshAll()
})
</script>

<template>
	<section
		class="home-server-info flex h-full min-h-0 min-w-0 flex-col gap-2"
		:data-size="dashboardSize"
	>
		<header class="flex min-w-0 items-center gap-2">
			<ServerIcon class="size-5 shrink-0 text-brand" aria-hidden="true" />
			<h2 class="m-0 min-w-0 flex-1 truncate text-[1rem] font-bold text-contrast">
				{{ formatMessage(messages.title) }}
			</h2>
			<ButtonStyled circular size="small" type="transparent">
				<button
					v-tooltip="formatMessage(messages.refresh)"
					:disabled="refreshing || addresses.length === 0"
					@click="refreshAll"
				>
					<RefreshCwIcon :class="{ 'animate-spin': refreshing }" />
				</button>
			</ButtonStyled>
			<ButtonStyled circular size="small" type="transparent">
				<button v-tooltip="formatMessage(messages.settings)" @click="showSettings">
					<PencilIcon />
				</button>
			</ButtonStyled>
		</header>

		<div
			v-if="addresses.length === 0"
			class="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-center text-xs text-secondary"
		>
			<ServerIcon class="size-7 opacity-60" aria-hidden="true" />
			<span>{{ formatMessage(messages.empty) }}</span>
			<ButtonStyled size="small">
				<button @click="showSettings">{{ formatMessage(messages.settings) }}</button>
			</ButtonStyled>
		</div>

		<ul v-else class="m-0 flex min-h-0 list-none flex-col gap-1 overflow-y-auto p-0 pr-1">
			<li
				v-for="address in addresses"
				:key="address"
				class="flex min-w-0 gap-2 rounded-lg bg-button-bg p-2"
			>
				<Avatar
					v-if="stateFor(address).status?.favicon"
					:src="stateFor(address).status?.favicon"
					:tint-by="address"
					size="32px"
					class="shrink-0"
				/>
				<div
					v-else
					class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-4 text-secondary"
				>
					<ServerIcon class="size-4" aria-hidden="true" />
				</div>

				<div class="flex min-w-0 flex-1 flex-col gap-0.5">
					<div class="flex min-w-0 items-center gap-2">
						<strong class="min-w-0 flex-1 truncate text-xs text-contrast">
							{{ address }}
						</strong>
						<span
							v-if="stateFor(address).status?.ping != null"
							class="flex shrink-0 items-center gap-1 text-[0.6875rem] text-secondary"
						>
							<SignalIcon class="size-3" aria-hidden="true" />
							{{ formatMessage(messages.latency, { ping: stateFor(address).status?.ping }) }}
						</span>
					</div>

					<div v-if="stateFor(address).refreshing" class="truncate text-[0.6875rem] text-secondary">
						{{ formatMessage(commonMessages.loadingLabel) }}
					</div>
					<div
						v-else-if="stateFor(address).renderedMotd"
						class="motd-renderer line-clamp-2 font-minecraft text-[0.6875rem] leading-4 text-secondary"
						v-html="stateFor(address).renderedMotd"
					/>
					<div v-else class="truncate text-[0.6875rem] text-red">
						{{ formatMessage(stateFor(address).failed ? messages.offline : messages.unknown) }}
					</div>

					<div
						class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.6875rem] text-secondary"
					>
						<span class="flex min-w-0 items-center gap-1">
							<GameIcon class="size-3 shrink-0" aria-hidden="true" />
							<span class="truncate">
								{{ stateFor(address).status?.version?.name ?? formatMessage(messages.unknown) }}
							</span>
						</span>
						<span class="flex min-w-0 items-center gap-1">
							<UsersIcon class="size-3 shrink-0" aria-hidden="true" />
							<span class="truncate">
								{{
									stateFor(address).status?.players
										? formatMessage(messages.players, {
												online: stateFor(address).status?.players?.online ?? 0,
												max: stateFor(address).status?.players?.max ?? 0,
											})
										: formatMessage(messages.unknown)
								}}
							</span>
						</span>
					</div>
				</div>
			</li>
		</ul>
	</section>

	<NewModal
		ref="modal"
		:header="formatMessage(messages.settingsTitle)"
		width="min(520px, calc(100vw - 2rem))"
	>
		<div class="flex flex-col gap-2">
			<StyledInput v-model="draft" multiline :rows="6" wrapper-class="w-full" />
			<p class="m-0 text-xs text-secondary">{{ formatMessage(messages.settingsHint) }}</p>
		</div>
		<template #actions>
			<div class="flex justify-end gap-2">
				<ButtonStyled type="outlined">
					<button @click="modal?.hide()">
						{{ formatMessage(commonMessages.cancelButton) }}
					</button>
				</ButtonStyled>
				<ButtonStyled color="brand">
					<button @click="saveSettings">
						{{ formatMessage(commonMessages.saveChangesButton) }}
					</button>
				</ButtonStyled>
			</div>
		</template>
	</NewModal>
</template>
