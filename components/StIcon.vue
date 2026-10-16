<script setup lang="ts">
// Set de iconos de Spentry. Trazo currentColor, outline 1.7.
// Incluye los iconos de interfaz y los de categorías (ver CAT_ICONS).

export type IconName =
  | 'home' | 'receipt' | 'chart' | 'tag' | 'settings' | 'plus' | 'minus'
  | 'edit' | 'trash' | 'check' | 'x' | 'undo'
  | 'chevronDown' | 'chevronRight' | 'chevronLeft' | 'arrowRight' | 'arrowUp' | 'arrowDown'
  | 'search' | 'eye' | 'eyeOff' | 'calendar' | 'bell' | 'note' | 'download'
  | 'sun' | 'moon' | 'monitor' | 'user' | 'logout' | 'lock' | 'mail' | 'image'
  | 'backspace' | 'wallet' | 'sparkle' | 'clock' | 'target' | 'filter'
  // categorías
  | 'food' | 'coffee' | 'basket' | 'bus' | 'car' | 'house' | 'bolt' | 'heart'
  | 'pill' | 'ticket' | 'bag' | 'gift' | 'book' | 'paw' | 'plane' | 'phone'
  | 'shirt' | 'game' | 'dumbbell' | 'wifi' | 'fuel' | 'drink' | 'music'
  | 'tv' | 'tool' | 'scissors' | 'store' | 'school' | 'dots'

interface Props {
  name: IconName | string
  size?: number | string
  stroke?: number | string
}
withDefaults(defineProps<Props>(), { size: 20, stroke: 1.7 })
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke-width="stroke"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    style="display: block; flex-shrink: 0;"
  >
    <!-- ── Interfaz ── -->
    <template v-if="name === 'home'">
      <path d="M4 11.5 12 4l8 7.5" /><path d="M6 10v9.5h12V10" />
    </template>
    <template v-else-if="name === 'receipt'">
      <path d="M6 3.5h12v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4v-17Z" />
      <path d="M9 8h6M9 11.5h6M9 15h3.5" />
    </template>
    <template v-else-if="name === 'chart'">
      <path d="M4 20V4" /><path d="M4 20h16" />
      <path d="M8 16v-3M12 16V8M16 16v-5M20 16v-7" />
    </template>
    <template v-else-if="name === 'tag'">
      <path d="M4 4h7.2L20 12.8a2 2 0 0 1 0 2.8l-4.4 4.4a2 2 0 0 1-2.8 0L4 11.2V4Z" />
      <circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'settings'">
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 3v2.2M12 18.8V21M4.4 7.5l1.9 1.1M17.7 15.4l1.9 1.1M19.6 7.5l-1.9 1.1M6.3 15.4l-1.9 1.1" />
    </template>
    <template v-else-if="name === 'plus'"><path d="M12 5v14M5 12h14" /></template>
    <template v-else-if="name === 'minus'"><path d="M5 12h14" /></template>
    <template v-else-if="name === 'edit'">
      <path d="M4 20h4l10.5-10.5a2 2 0 0 0-2.8-2.8L5 17.2 4 20Z" /><path d="M14 6.5 17.5 10" />
    </template>
    <template v-else-if="name === 'trash'">
      <path d="M5 7h14M10 7V5h4v2M6.5 7l.8 12a1 1 0 0 0 1 .95h7.4a1 1 0 0 0 1-.95L17.5 7" />
      <path d="M10.5 11v5M13.5 11v5" />
    </template>
    <template v-else-if="name === 'check'"><path d="M5 12.5 10 17l9-10" /></template>
    <template v-else-if="name === 'x'"><path d="M6 6l12 12M18 6 6 18" /></template>
    <template v-else-if="name === 'undo'">
      <path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </template>
    <template v-else-if="name === 'chevronDown'"><path d="M5 9l7 7 7-7" /></template>
    <template v-else-if="name === 'chevronRight'"><path d="M9 5l7 7-7 7" /></template>
    <template v-else-if="name === 'chevronLeft'"><path d="M15 5l-7 7 7 7" /></template>
    <template v-else-if="name === 'arrowRight'"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></template>
    <template v-else-if="name === 'arrowUp'"><path d="M12 19V5" /><path d="M6 11l6-6 6 6" /></template>
    <template v-else-if="name === 'arrowDown'"><path d="M12 5v14" /><path d="M6 13l6 6 6-6" /></template>
    <template v-else-if="name === 'search'"><circle cx="11" cy="11" r="6.4" /><path d="M16 16l4 4" /></template>
    <template v-else-if="name === 'eye'">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.6" />
    </template>
    <template v-else-if="name === 'eyeOff'">
      <path d="M4 4l16 16" /><path d="M9.5 9.7a2.6 2.6 0 0 0 3.6 3.6" />
      <path d="M6.2 6.5C3.9 8 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.6 0 3-.45 4.2-1.1M9.7 5.8A9.6 9.6 0 0 1 12 5.5C18 5.5 21.5 12 21.5 12a16 16 0 0 1-2.3 3" />
    </template>
    <template v-else-if="name === 'calendar'">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
    </template>
    <template v-else-if="name === 'bell'">
      <path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 5 1.8 6.2 1.8 6.2H4.7S6.5 15 6.5 10Z" /><path d="M10 19.2a2.1 2.1 0 0 0 4 0" />
    </template>
    <template v-else-if="name === 'note'">
      <path d="M5 4h9l5 5v11H5Z" /><path d="M14 4v5h5M8.5 13h7M8.5 16.5h5" />
    </template>
    <template v-else-if="name === 'download'">
      <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" /><path d="M5 19.5h14" />
    </template>
    <template v-else-if="name === 'sun'">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2.2M12 18.8V21M4.4 4.4l1.6 1.6M18 18l1.6 1.6M3 12h2.2M18.8 12H21M4.4 19.6 6 18M18 6l1.6-1.6" />
    </template>
    <template v-else-if="name === 'moon'"><path d="M19 13.5A7.5 7.5 0 0 1 10.5 5 6.5 6.5 0 1 0 19 13.5Z" /></template>
    <template v-else-if="name === 'monitor'">
      <rect x="3" y="4.5" width="18" height="12" rx="2" /><path d="M9 20h6M12 16.5V20" />
    </template>
    <template v-else-if="name === 'user'"><circle cx="12" cy="8.5" r="3.7" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></template>
    <template v-else-if="name === 'logout'">
      <path d="M14 6.5V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1.5" />
      <path d="M10 12h10M16.5 8.5 20 12l-3.5 3.5" />
    </template>
    <template v-else-if="name === 'lock'">
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </template>
    <template v-else-if="name === 'mail'"><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="m4 7 8 5.5L20 7" /></template>
    <template v-else-if="name === 'image'">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><circle cx="9" cy="10" r="1.8" />
      <path d="m4.5 17 4.5-4 3.5 3 3-2.5 4.5 4" />
    </template>
    <template v-else-if="name === 'backspace'">
      <path d="M9 5.5h10a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H9L3.5 12 9 5.5Z" /><path d="M12 9.5l5 5M17 9.5l-5 5" />
    </template>
    <template v-else-if="name === 'wallet'">
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" /><rect x="4" y="8" width="16" height="11" rx="2.5" />
      <circle cx="16" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'sparkle'">
      <path d="M12 3l1.8 5.4c.3.9.9 1.5 1.8 1.8L21 12l-5.4 1.8c-.9.3-1.5.9-1.8 1.8L12 21l-1.8-5.4c-.3-.9-.9-1.5-1.8-1.8L3 12l5.4-1.8c.9-.3 1.5-.9 1.8-1.8L12 3Z" />
    </template>
    <template v-else-if="name === 'clock'"><circle cx="12" cy="12" r="8.2" /><path d="M12 7.5V12l3 1.8" /></template>
    <template v-else-if="name === 'target'">
      <circle cx="12" cy="12" r="8.2" /><circle cx="12" cy="12" r="4.4" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'filter'"><path d="M4 6h16l-6 7v5l-4 2v-7Z" /></template>

    <!-- ── Categorías ── -->
    <template v-else-if="name === 'food'">
      <path d="M6 3v5M8.5 3v5M11 3v5" /><path d="M6 8a2.5 2.5 0 0 0 5 0" /><path d="M8.5 10.5V21" />
      <path d="M17.5 3c-1.8 1.3-2.7 3.6-2.7 6.6V13h2.7V3Z" /><path d="M17.5 13v8" />
    </template>
    <template v-else-if="name === 'coffee'">
      <path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9Z" /><path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M9 3.5c0 1 1 1.5 1 2.5M12.5 3.5c0 1 1 1.5 1 2.5" />
    </template>
    <template v-else-if="name === 'basket'">
      <path d="M4 10h16l-1.6 8.4a2 2 0 0 1-2 1.6H7.6a2 2 0 0 1-2-1.6L4 10Z" />
      <path d="M7.5 10 10 4.5M16.5 10 14 4.5M9.5 13.5v3M14.5 13.5v3" />
    </template>
    <template v-else-if="name === 'bus'">
      <rect x="5" y="3.5" width="14" height="14" rx="3" /><path d="M5 11h14M8.5 7h7M7.5 17.5V20M16.5 17.5V20" />
      <circle cx="8.5" cy="14.3" r=".9" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="14.3" r=".9" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'car'">
      <path d="M4 16v-3.5l1.8-4.6A2 2 0 0 1 7.7 6.5h8.6a2 2 0 0 1 1.9 1.4L20 12.5V16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
      <path d="M4.5 12.5h15M7 17v2M17 17v2" />
      <circle cx="7.6" cy="14.6" r=".9" fill="currentColor" stroke="none" />
      <circle cx="16.4" cy="14.6" r=".9" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'house'">
      <path d="M4 11 12 4l8 7" /><path d="M6 9.5V20h12V9.5" /><path d="M10 20v-5h4v5" />
    </template>
    <template v-else-if="name === 'bolt'"><path d="M13 3 5.5 13.5H12L11 21l7.5-10.5H12L13 3Z" /></template>
    <template v-else-if="name === 'heart'">
      <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" />
    </template>
    <template v-else-if="name === 'pill'">
      <g transform="rotate(-45 12 12)"><rect x="3.5" y="8.5" width="17" height="7" rx="3.5" /><path d="M12 8.5v7" /></g>
    </template>
    <template v-else-if="name === 'ticket'">
      <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4V7.5Z" />
      <path d="M14 7v10" stroke-dasharray="1.6 2.2" />
    </template>
    <template v-else-if="name === 'bag'">
      <path d="M5.5 8h13l-1 12h-11l-1-12Z" /><path d="M9 10V7a3 3 0 0 1 6 0v3" />
    </template>
    <template v-else-if="name === 'gift'">
      <rect x="4" y="9" width="16" height="4" rx="1" /><path d="M5.5 13v7h13v-7M12 9v11" />
      <path d="M12 9c-1.5-3-5-3.5-5-1.2C7 9 9.5 9 12 9Zm0 0c1.5-3 5-3.5 5-1.2C17 9 14.5 9 12 9Z" />
    </template>
    <template v-else-if="name === 'book'">
      <path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H19v13H6.5A1.5 1.5 0 0 0 5 18.5v-13Z" />
      <path d="M5 18.5A1.5 1.5 0 0 0 6.5 20H19M9 8h6" />
    </template>
    <template v-else-if="name === 'paw'">
      <circle cx="6.8" cy="10.6" r="1.6" /><circle cx="9.9" cy="6.9" r="1.6" />
      <circle cx="14.1" cy="6.9" r="1.6" /><circle cx="17.2" cy="10.6" r="1.6" />
      <path d="M12 12c-2.8 0-5 3.6-5 5.6 0 1.4 1.1 2.4 2.5 2.4 1 0 1.6-.5 2.5-.5s1.5.5 2.5.5c1.4 0 2.5-1 2.5-2.4C17 15.6 14.8 12 12 12Z" />
    </template>
    <template v-else-if="name === 'plane'"><path d="M21 3 3 10.5l7 2.5 2.5 7L21 3Z" /><path d="M10 13l4.5-4.5" /></template>
    <template v-else-if="name === 'phone'"><rect x="7" y="3" width="10" height="18" rx="2.5" /><path d="M11 17.5h2" /></template>
    <template v-else-if="name === 'shirt'">
      <path d="M8 4 4 6.5l1.8 3.5L8 9v11h8V9l2.2 1 1.8-3.5L16 4c-.5 1.5-2 2.5-4 2.5S8.5 5.5 8 4Z" />
    </template>
    <template v-else-if="name === 'game'">
      <path d="M7 9h10a4 4 0 0 1 4 4.5l-.4 3a2.3 2.3 0 0 1-4 1.1L15 16H9l-1.6 1.6a2.3 2.3 0 0 1-4-1.1l-.4-3A4 4 0 0 1 7 9Z" />
      <path d="M7.5 11.5v3M6 13h3" />
      <circle cx="15.5" cy="12" r=".9" fill="currentColor" stroke="none" />
      <circle cx="17" cy="14.2" r=".9" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'dumbbell'"><path d="M6 8v8M18 8v8M3.5 10v4M20.5 10v4M6 12h12" /></template>
    <template v-else-if="name === 'wifi'">
      <path d="M4 9.5a12 12 0 0 1 16 0M7 13a7.5 7.5 0 0 1 10 0M10 16.3a3 3 0 0 1 4 0" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'fuel'">
      <path d="M5 20V5.5A1.5 1.5 0 0 1 6.5 4h6A1.5 1.5 0 0 1 14 5.5V20M4 20h11M7 8h5" />
      <path d="M14 10h1.5a1.5 1.5 0 0 1 1.5 1.5V16a1.5 1.5 0 0 0 3 0V8.5L17.5 6" />
    </template>
    <template v-else-if="name === 'drink'"><path d="M5 4h14l-7 8-7-8Z" /><path d="M12 12v8M8.5 20h7" /></template>
    <template v-else-if="name === 'music'">
      <path d="M9 18V5.5l10-2V16" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" />
    </template>
    <template v-else-if="name === 'tv'"><rect x="3.5" y="6" width="17" height="12" rx="2.5" /><path d="M9 3l3 3 3-3" /></template>
    <template v-else-if="name === 'tool'">
      <path d="M15 4.5a4.5 4.5 0 0 0-4.2 6.1L4.5 16.9a1.8 1.8 0 0 0 2.6 2.6l6.3-6.3A4.5 4.5 0 0 0 19.5 9l-2.7 2.7-2.4-.4-.4-2.4 2.7-2.7A4.5 4.5 0 0 0 15 4.5Z" />
    </template>
    <template v-else-if="name === 'scissors'">
      <circle cx="6.5" cy="7" r="2.5" /><circle cx="6.5" cy="17" r="2.5" /><path d="M8.6 8.4 20 17M8.6 15.6 20 7" />
    </template>
    <template v-else-if="name === 'store'">
      <path d="M4 9.5 5.5 4.5h13L20 9.5" />
      <path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0" />
      <path d="M5.5 12v8h13v-8M10 20v-4.5h4V20" />
    </template>
    <template v-else-if="name === 'school'">
      <path d="M2.5 9.5 12 5l9.5 4.5L12 14 2.5 9.5Z" /><path d="M6.5 11.5V16c1.5 1.5 3.5 2 5.5 2s4-.5 5.5-2v-4.5M21.5 9.5V14" />
    </template>
    <template v-else-if="name === 'dots'">
      <circle cx="6" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </template>
    <template v-else>
      <path d="M4 4h7.2L20 12.8a2 2 0 0 1 0 2.8l-4.4 4.4a2 2 0 0 1-2.8 0L4 11.2V4Z" />
      <circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none" />
    </template>
  </svg>
</template>
