import type { Config } from 'tailwindcss'

// Spentry usa sobre todo CSS propio (assets/css). Tailwind queda para
// utilidades puntuales; el sistema visual vive en variables CSS.
export default <Partial<Config>>{
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
    './error.vue',
  ],
  corePlugins: {
    // El preflight de Tailwind pisa estilos de botones/inputs del sistema propio.
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        lime: {
          DEFAULT: '#96D15A',
          deep: '#4F8A1F',
          ink: '#142208',
        },
      },
      fontFamily: {
        display: ['Parkinsans', 'Nunito', 'system-ui', 'sans-serif'],
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
    },
  },
}
