<script setup>
// Minimal inline icon set (stroke-based, 24x24). Falls back to a dot.
const paths = {
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  cart: 'M3 3h2l2.4 12.3a2 2 0 0 0 2 1.7h7.7a2 2 0 0 0 2-1.6L22 8H6',
  box: 'M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7',
  tag: 'M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9z',
  ruler: 'M3 3h18v6H3zM7 3v3M11 3v3M15 3v3M19 3v3',
  layers: 'M12 2 2 7l10 5 10-5-10-5zM2 12l10 5 10-5M2 17l10 5 10-5',
  warehouse: 'M3 21V8l9-5 9 5v13M9 21v-7h6v7',
  truck: 'M1 5h13v11H1zM14 8h4l3 3v5h-7M5.5 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18.5 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9',
  clipboard: 'M9 4h6v2H9zM6 6h12v15H6zM9 11h6M9 15h6',
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5 5h14l3 7v6H2v-6z',
  receipt: 'M4 2h16v20l-3-2-3 2-3-2-3 2V2zM8 7h8M8 11h8M8 15h5',
  card: 'M2 6h20v12H2zM2 10h20',
  cash: 'M2 6h20v12H2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  pill: 'M10.5 20.5a5 5 0 0 1-7-7l6-6a5 5 0 0 1 7 7l-6 6zM8 8l8 8',
  factory: 'M3 21V10l5 3V10l5 3V10l5 3V21zM3 21h18',
  doc: 'M6 2h9l5 5v15H6zM14 2v6h6',
  table: 'M3 5h18v4H3zM5 9v10M19 9v10M3 14h18',
  menu: 'M4 6h16M4 12h16M4 18h16',
  calendar: 'M3 5h18v16H3zM3 9h18M8 3v4M16 3v4',
  fire: 'M12 2s4 4 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-3 .5 2 2 2 2 0 0-2-1-3 1-5z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  minus: 'M5 12h14',
  plus: 'M12 5v14M5 12h14',
  chart: 'M3 3v18h18M7 14l3-3 3 3 4-6',
  building: 'M3 21V3h12v18M15 9h6v12M7 7h2M7 11h2M7 15h2',
  coin: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9 9h4a2 2 0 0 1 0 4H9h4a2 2 0 0 1 0 4H9',
  percent: 'M19 5 5 19M6.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM17.5 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  shield: 'M12 2 4 5v6c0 5 3.5 8 8 11 4.5-3 8-6 8-11V5l-8-3z',
  key: 'M21 2 15 8M18 5l2 2M10.5 12.5a4 4 0 1 1-5.7 5.7 4 4 0 0 1 5.7-5.7zM10.5 12.5 15 8',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  menu2: 'M3 12h18M3 6h18M3 18h18',
  x: 'M18 6 6 18M6 6l12 12',
  edit: 'M11 4H4v16h16v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
}
defineProps({ name: { type: String, required: true }, size: { type: [Number, String], default: 18 } })
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path :d="paths[name] || 'M12 12h.01'" />
  </svg>
</template>
