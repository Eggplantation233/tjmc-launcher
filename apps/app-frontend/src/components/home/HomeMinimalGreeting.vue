<script setup lang="ts">
import { defineMessages, useVIntl } from '@modrinth/ui'
import { computed, onUnmounted, ref } from 'vue'

import { getTimeBucket } from './home-utils'

const props = withDefaults(
	defineProps<{
		playerName?: string | null
	}>(),
	{
		playerName: null,
	},
)

const { formatMessage } = useVIntl()
const now = ref(new Date())
const messages = defineMessages({
	withPlayer: {
		id: 'app.home.greeting.minimal.with-player',
		defaultMessage: '{greeting}, {name}',
	},
	lateNight: {
		id: 'app.home.greeting.minimal.late-night',
		defaultMessage: 'Good evening',
	},
	dawn: {
		id: 'app.home.greeting.minimal.dawn',
		defaultMessage: 'Good morning',
	},
	morning: {
		id: 'app.home.greeting.minimal.morning',
		defaultMessage: 'Good morning',
	},
	afternoon: {
		id: 'app.home.greeting.minimal.afternoon',
		defaultMessage: 'Good afternoon',
	},
	evening: {
		id: 'app.home.greeting.minimal.evening',
		defaultMessage: 'Good evening',
	},
	night: {
		id: 'app.home.greeting.minimal.night',
		defaultMessage: 'Good evening',
	},
})

const minimalGreetings = {
	'late-night': messages.lateNight,
	dawn: messages.dawn,
	morning: messages.morning,
	afternoon: messages.afternoon,
	evening: messages.evening,
	night: messages.night,
}

const greeting = computed(() => formatMessage(minimalGreetings[getTimeBucket(now.value)]))

const heading = computed(() =>
	props.playerName
		? formatMessage(messages.withPlayer, {
				name: props.playerName,
				greeting: greeting.value,
			})
		: greeting.value,
)

const updateClock = () => {
	now.value = new Date()
}
const timer = window.setInterval(updateClock, 60_000)

onUnmounted(() => window.clearInterval(timer))
</script>

<template>
	<header class="home-greeting flex min-w-0 flex-col items-center gap-3 text-center">
		<h1 class="m-0 max-w-full break-words text-2xl font-extrabold text-contrast">
			{{ heading }}
		</h1>
		<div class="h-0.5 w-8 rounded-full bg-brand" aria-hidden="true" />
	</header>
</template>
