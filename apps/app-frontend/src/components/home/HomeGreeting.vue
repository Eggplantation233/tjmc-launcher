<script setup lang="ts">
import { defineMessages, useVIntl } from '@modrinth/ui'
import { computed, onMounted, onUnmounted, ref } from 'vue'

import afternoonBackground from '@/assets/bg_af.jpg'
import dawnBackground from '@/assets/bg_d.jpg'
import eveningBackground from '@/assets/bg_e.jpg'
import lateNightBackground from '@/assets/bg_ln.jpg'
import morningBackground from '@/assets/bg_m.jpg'
import nightBackground from '@/assets/bg_n.jpg'
import type { HomeWidgetSize } from '@/components/home/home-dashboard'
import { getTimeBucket, type HomeTimeBucket } from '@/components/home/home-utils'
import { getStartupNotification } from '@/helpers/remote-notifications'

const props = withDefaults(
	defineProps<{
		playerName?: string | null
		dashboardSize?: HomeWidgetSize | null
	}>(),
	{
		playerName: null,
		dashboardSize: null,
	},
)

const { formatMessage, locale } = useVIntl()
const now = ref(new Date())
const noticeText = ref('')
const messages = defineMessages({
	fallbackNotice: {
		id: 'app.home.date-notice.fallback',
		defaultMessage: '欢迎来到 TJMC',
	},
	greetingWithPlayer: {
		id: 'app.home.greeting.minimal.with-player',
		defaultMessage: '{greeting}, {name}',
	},
	minimalLateNight: {
		id: 'app.home.greeting.minimal.late-night',
		defaultMessage: 'Good evening',
	},
	minimalDawn: {
		id: 'app.home.greeting.minimal.dawn',
		defaultMessage: 'Good morning',
	},
	minimalMorning: {
		id: 'app.home.greeting.minimal.morning',
		defaultMessage: 'Good morning',
	},
	minimalAfternoon: {
		id: 'app.home.greeting.minimal.afternoon',
		defaultMessage: 'Good afternoon',
	},
	minimalEvening: {
		id: 'app.home.greeting.minimal.evening',
		defaultMessage: 'Good evening',
	},
	minimalNight: {
		id: 'app.home.greeting.minimal.night',
		defaultMessage: 'Good evening',
	},
})
const minimalGreetings = {
	'late-night': messages.minimalLateNight,
	dawn: messages.minimalDawn,
	morning: messages.minimalMorning,
	afternoon: messages.minimalAfternoon,
	evening: messages.minimalEvening,
	night: messages.minimalNight,
}
const newsBackgrounds: Record<HomeTimeBucket, string> = {
	'late-night': lateNightBackground,
	dawn: dawnBackground,
	morning: morningBackground,
	afternoon: afternoonBackground,
	evening: eveningBackground,
	night: nightBackground,
}

const dateLabel = computed(() =>
	new Intl.DateTimeFormat(locale.value, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		weekday: 'long',
	}).format(now.value),
)

const newsBackground = computed(() => newsBackgrounds[getTimeBucket(now.value)])
const subtitle = computed(() => noticeText.value || formatMessage(messages.fallbackNotice))
const shouldScroll = computed(() => subtitle.value.length > 24)
const greeting = computed(() => formatMessage(minimalGreetings[getTimeBucket(now.value)]))
const welcomeText = computed(() =>
	props.playerName
		? formatMessage(messages.greetingWithPlayer, {
				name: props.playerName,
				greeting: greeting.value,
			})
		: greeting.value,
)

const updateClock = () => {
	now.value = new Date()
}
const timer = window.setInterval(updateClock, 60_000)

onMounted(async () => {
	noticeText.value = (await getStartupNotification())?.content ?? ''
})

onUnmounted(() => window.clearInterval(timer))
</script>

<template>
	<header
		class="home-date-notice relative h-full min-w-0 overflow-hidden"
		:data-size="dashboardSize ?? undefined"
	>
		<img class="home-date-notice__background" :src="newsBackground" alt="" aria-hidden="true" />
		<div class="home-date-notice__shade" aria-hidden="true" />

		<div class="home-date-notice__date">
			{{ dateLabel }}
		</div>
		<div class="home-date-notice__beta">●beta</div>

		<div class="home-date-notice__news-stack">
			<div class="home-date-notice__titlebar">
				<div class="home-date-notice__breaking">
					<span>Breaking</span>
					<span>News</span>
				</div>
				<div class="home-date-notice__welcome" :title="welcomeText">
					{{ welcomeText }}
				</div>
			</div>
			<div class="home-date-notice__news-strip">
				<div class="home-date-notice__viewport" :title="subtitle">
					<div
						class="home-date-notice__track"
						:class="{ 'is-scrolling': shouldScroll }"
						role="status"
						:aria-label="subtitle"
					>
						<span class="home-date-notice__text">{{ subtitle }}</span>
						<span v-if="shouldScroll" class="home-date-notice__text" aria-hidden="true">
							{{ subtitle }}
						</span>
					</div>
				</div>
			</div>
		</div>
	</header>
</template>

<style scoped>
.home-date-notice {
	background: #d6c6f2;
	isolation: isolate;
}

.home-date-notice__background,
.home-date-notice__shade {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
}

.home-date-notice__background {
	object-fit: cover;
	object-position: center;
}

.home-date-notice__shade {
	background: linear-gradient(
		to bottom,
		rgb(20 13 27 / 8%),
		rgb(20 13 27 / 4%) 48%,
		rgb(20 13 27 / 18%)
	);
	pointer-events: none;
}

.home-date-notice__date,
.home-date-notice__beta {
	position: absolute;
	top: 0.9rem;
	z-index: 2;
	padding: 0.38rem 0.7rem;
	border-radius: 0.35rem;
	font-size: 0.75rem;
	font-weight: 800;
	line-height: 1.2;
	white-space: nowrap;
	text-shadow: none;
	-webkit-text-stroke: 0;
}

.home-date-notice__date {
	left: 0.9rem;
	max-width: calc(100% - 1.8rem);
	overflow: hidden;
	background: rgb(255 255 255 / 78%);
	color: #2d2435;
	text-overflow: ellipsis;
}

.home-date-notice__beta {
	right: 0.9rem;
	background: rgb(255 184 116 / 52%);
	color: #fff;
}

.home-date-notice__news-stack {
	position: absolute;
	right: 0;
	bottom: 0;
	left: 0;
	z-index: 2;
	display: flex;
	flex-direction: column;
}

.home-date-notice__titlebar {
	display: flex;
	min-width: 0;
	height: 1.9125rem;
	align-items: stretch;
}

.home-date-notice__breaking {
	display: flex;
	width: 4.75rem;
	flex: 0 0 4.75rem;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: var(--color-brand);
	color: #fff;
	font-size: 0.65rem;
	font-weight: 900;
	line-height: 1.05;
	text-align: center;
	text-transform: uppercase;
	text-shadow: none;
	-webkit-text-stroke: 0;
}

.home-date-notice__welcome {
	display: block;
	min-width: 0;
	flex: 1;
	overflow: hidden;
	padding: 0 0.75rem;
	background: rgb(255 255 255 / 92%);
	color: #2d2435;
	font-size: 1rem;
	font-weight: 700;
	line-height: 1.9125rem;
	text-overflow: ellipsis;
	white-space: nowrap;
	text-shadow: none;
	-webkit-text-stroke: 0;
}

.home-date-notice__news-strip {
	display: flex;
	min-width: 0;
	height: 1.4rem;
	align-items: stretch;
	background: #e5daf5;
	color: #2d2435;
}

.home-date-notice__viewport {
	display: flex;
	min-width: 0;
	flex: 1;
	align-items: center;
	overflow: hidden;
	padding: 0 0.8rem;
	mask-image: linear-gradient(
		to right,
		transparent,
		black 0.65rem,
		black calc(100% - 0.65rem),
		transparent
	);
}

.home-date-notice__track {
	display: flex;
	width: max-content;
	min-width: 100%;
	white-space: nowrap;
}

.home-date-notice__track.is-scrolling {
	gap: 3rem;
	animation: home-notice-marquee 18s linear infinite;
}

.home-date-notice__track.is-scrolling:hover {
	animation-play-state: paused;
}

.home-date-notice__text {
	display: block;
	font-size: 0.75rem;
	font-weight: 700;
	line-height: 1.25rem;
	color: #2d2435;
	text-shadow: none;
	-webkit-text-stroke: 0;
}

@keyframes home-notice-marquee {
	from {
		transform: translateX(0);
	}

	to {
		transform: translateX(calc(-50% - 1.5rem));
	}
}

@media (prefers-reduced-motion: reduce) {
	.home-date-notice__track.is-scrolling {
		animation: none;
	}

	.home-date-notice__text:nth-child(2) {
		display: none;
	}
}
</style>
