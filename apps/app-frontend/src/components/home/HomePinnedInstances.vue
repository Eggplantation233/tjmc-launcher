<script setup lang="ts">
import { GridIcon, PinIcon } from '@modrinth/assets'
import { defineMessages, injectNotificationManager, useVIntl } from '@modrinth/ui'
import dayjs from 'dayjs'
import { computed } from 'vue'

import type { HomeWidgetSize } from '@/components/home/home-dashboard'
import { useHomeDashboardRuntime } from '@/components/home/home-dashboard-runtime'
import InstanceItem from '@/components/ui/world/InstanceItem.vue'
import { set_pinned } from '@/helpers/instance'
import type { GameInstance } from '@/helpers/types'

const props = defineProps<{
	instances: GameInstance[]
	dashboard?: boolean
	dashboardSize?: HomeWidgetSize | null
}>()

const { handleError } = injectNotificationManager()
const { formatMessage } = useVIntl()
const { runningInstanceIds } = useHomeDashboardRuntime()
const messages = defineMessages({
	pinnedInstances: {
		id: 'app.home.instances.pinned',
		defaultMessage: 'Pinned instances',
	},
	emptyPinned: {
		id: 'app.home.instances.pinned-empty',
		defaultMessage: 'Pin an instance from its card menu or the library to keep it here.',
	},
})

const pinnedInstances = computed(() =>
	props.instances
		.filter((instance) => instance.pinned_at)
		.slice()
		.sort((a, b) => new Date(b.pinned_at ?? 0).getTime() - new Date(a.pinned_at ?? 0).getTime()),
)
async function updatePinned(instance: GameInstance, pinned: boolean) {
	await set_pinned(instance.id, pinned).catch(handleError)
}
</script>

<template>
	<section
		class="home-pinned-instances flex min-w-0 min-h-0 h-full flex-col gap-3"
		:data-size="dashboardSize"
	>
		<div class="home-widget-heading flex min-w-0 h-8 flex-none items-center gap-2">
			<PinIcon class="size-5 shrink-0 text-brand" aria-hidden="true" />
			<h2>
				{{ formatMessage(messages.pinnedInstances) }}
			</h2>
		</div>
		<div
			v-if="pinnedInstances.length > 0"
			class="home-instance-list grid min-w-0 min-h-0 flex-1 grid-auto-rows-max gap-1 overflow-x-hidden overflow-y-auto pr-1"
		>
			<InstanceItem
				v-for="instance in pinnedInstances"
				:key="instance.id"
				:instance="instance"
				:last-played="instance.last_played ? dayjs(instance.last_played) : undefined"
				:flat="dashboard"
				:playing="runningInstanceIds.includes(instance.id)"
				dashboard-density="compact"
				pinned
				@pinned-change="updatePinned"
			/>
		</div>
		<div v-else class="home-widget-empty">
			<GridIcon aria-hidden="true" />
			<span>{{ formatMessage(messages.emptyPinned) }}</span>
		</div>
	</section>
</template>

<style scoped>
.home-widget-heading h2 {
	min-width: 0;
	overflow: hidden;
	margin: 0;
	color: var(--color-contrast);
	font-size: 1rem;
	font-weight: 700;
	letter-spacing: 0;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.home-widget-empty {
	display: flex;
	max-width: 22rem;
	margin: auto;
	flex-direction: column;
	align-items: center;
	gap: 0.5rem;
	color: var(--color-secondary);
	font-size: 0.8125rem;
	line-height: 1.4;
	text-align: center;
}

.home-widget-empty svg {
	width: 1.5rem;
	height: 1.5rem;
	opacity: 0.7;
}
</style>
