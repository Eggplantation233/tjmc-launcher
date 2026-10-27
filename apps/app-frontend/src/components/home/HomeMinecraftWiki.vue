<script setup lang="ts">
import { ExternalIcon, WikiIcon } from '@modrinth/assets'
import { defineMessages, useVIntl } from '@modrinth/ui'
import { openUrl } from '@tauri-apps/plugin-opener'
import { onMounted, ref } from 'vue'

import type { HomeWidgetSize } from '@/components/home/home-dashboard'
import {
	fetchLatestMinecraftWikiRelease,
	type MinecraftWikiRelease,
} from '@/helpers/minecraft-wiki'

defineProps<{
	dashboardSize?: HomeWidgetSize | null
}>()

const { formatMessage } = useVIntl()
const release = ref<MinecraftWikiRelease | null>(null)
const loading = ref(true)
const failed = ref(false)

const messages = defineMessages({
	title: { id: 'app.home.minecraft-wiki.title', defaultMessage: 'Minecraft 最新版本' },
	loading: {
		id: 'app.home.minecraft-wiki.loading',
		defaultMessage: 'Loading the latest Java version…',
	},
	empty: {
		id: 'app.home.minecraft-wiki.empty',
		defaultMessage: 'No latest version is available.',
	},
	failed: {
		id: 'app.home.minecraft-wiki.failed',
		defaultMessage: 'Could not load the latest version.',
	},
	openTheme: {
		id: 'app.home.minecraft-wiki.open-theme',
		defaultMessage: 'Open version theme',
	},
	openVersion: {
		id: 'app.home.minecraft-wiki.open-version',
		defaultMessage: 'Open Java version page',
	},
})

async function openWiki(url: string) {
	await openUrl(url).catch(() => undefined)
}

onMounted(async () => {
	try {
		release.value = await fetchLatestMinecraftWikiRelease()
	} catch {
		failed.value = true
	} finally {
		loading.value = false
	}
})
</script>

<template>
	<section class="flex h-full min-h-0 min-w-0 flex-col gap-2 overflow-hidden">
		<header class="flex h-8 min-w-0 flex-none items-center gap-2">
			<WikiIcon class="size-5 shrink-0 text-brand" aria-hidden="true" />
			<h2 class="m-0 min-w-0 flex-1 truncate text-[1rem] font-bold text-contrast">
				{{ formatMessage(messages.title) }}
			</h2>
		</header>

		<div
			v-if="loading"
			class="flex min-h-0 flex-1 items-center justify-center text-sm text-secondary"
		>
			{{ formatMessage(messages.loading) }}
		</div>
		<div
			v-else-if="!release"
			class="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-secondary"
		>
			<WikiIcon class="size-8 opacity-60" aria-hidden="true" />
			<span>{{ formatMessage(failed ? messages.failed : messages.empty) }}</span>
		</div>
		<div v-else class="relative min-h-0 flex-1 overflow-hidden rounded-lg bg-surface-2">
			<img
				:src="release.image_url"
				:alt="release.theme_name"
				class="absolute inset-0 size-full object-cover"
			/>
			<div
				class="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-4 pb-3 pt-12 text-white"
			>
				<button
					type="button"
					class="flex min-w-0 cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-left text-lg font-bold text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-shadow"
					:aria-label="formatMessage(messages.openTheme)"
					@click="openWiki(release.theme_url)"
				>
					<span class="truncate">{{ release.theme_name }}</span>
					<ExternalIcon class="size-4 shrink-0" />
				</button>
				<button
					type="button"
					class="flex w-fit cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-xs font-semibold text-white/90 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-shadow"
					:aria-label="formatMessage(messages.openVersion)"
					@click="openWiki(release.version_url)"
				>
					<span>{{ release.edition }}</span>
					<span>{{ release.version }}</span>
				</button>
			</div>
		</div>
	</section>
</template>
