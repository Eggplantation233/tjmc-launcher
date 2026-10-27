<template>
	<Transition name="splash-fade" @after-leave="onAfterLeave">
		<div
			v-if="!doneLoading"
			class="light fixed inset-0 z-[10000] bg-white"
			style="
				--color-brand: var(--custom-accent-light, #a56fcf);
				--color-brand-highlight: color-mix(in srgb, var(--color-brand) 25%, transparent);
			"
		>
			<div
				class="absolute h-screen w-full flex flex-col justify-center items-center gap-4 z-[9998]"
				data-tauri-drag-region
			>
				<img class="app-logo" src="@/assets/tjmc.png" alt="TJMC Launcher" />
				<ProgressBar class="max-w-xs" :progress="Math.min(loadingProgress, 100)" color="brand" />
				<span v-if="message">{{ message }}</span>
			</div>
			<div class="absolute top-0 left-0 h-full w-full bg-white z-[9995]"></div>
		</div>
	</Transition>
</template>

<script setup>
import { defineMessages, injectLoadingState, useVIntl } from '@modrinth/ui'
import { ref, watch } from 'vue'

import ProgressBar from '@/components/ui/ProgressBar.vue'
import { loading_listener } from '@/helpers/events.js'

const doneLoading = ref(false)
const loadingProgress = ref(0)
const message = ref()

const MIN_DISPLAY_MS = 500
const mountedAt = Date.now()

const loading = injectLoadingState()
const { formatMessage } = useVIntl()

const messages = defineMessages({
	updatingAppDirectory: {
		id: 'app.splash.updating-app-directory',
		defaultMessage: 'Updating app directory...',
	},
	checkingForUpdates: {
		id: 'app.splash.checking-for-updates',
		defaultMessage: 'Checking for updates...',
	},
})

function onAfterLeave() {
	loading.setEnabled(true)
}

watch(
	[loading.barEnabled, loading.pending],
	([barEnabled, pending]) => {
		if (barEnabled) {
			return
		}

		if (pending) {
			loadingProgress.value = 0
			fakeLoadingIncrease()
			return
		}

		const elapsed = Date.now() - mountedAt
		const delay = Math.max(0, MIN_DISPLAY_MS - elapsed)

		setTimeout(() => {
			if (loading.pending.value) {
				return
			}
			doneLoading.value = true
		}, delay)
	},
	{ immediate: true },
)

function fakeLoadingIncrease() {
	if (loadingProgress.value < 95) {
		setTimeout(() => {
			loadingProgress.value += 2
			fakeLoadingIncrease()
		}, 5)
	}
}

loading_listener(async (e) => {
	if (e.event.type === 'directory_move') {
		loadingProgress.value = 100 * (e.fraction ?? 1)
		message.value = formatMessage(messages.updatingAppDirectory)
	} else if (e.event.type === 'checking_for_updates') {
		loadingProgress.value = 100 * (e.fraction ?? 1)
		message.value = formatMessage(messages.checkingForUpdates)
	}
})
</script>

<style scoped lang="scss">
.splash-fade-leave-active {
	transition: opacity 0.3s ease-in-out;
}

.splash-fade-leave-to {
	opacity: 0;
}

.app-logo {
	height: min(11rem, 30vh);
	width: min(11rem, 30vw);
	object-fit: contain;
}
</style>
