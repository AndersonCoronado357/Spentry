import { cargarDatos, guardarPerfil, useDatos, _loaded } from '~/composables/useDatos'

// Carga el estado del usuario al iniciar la app (SPA) y persiste los cambios
// de perfil (nombre, foto, moneda, presupuesto, recordatorio) con un debounce.
export default defineNuxtPlugin(async () => {
  if (window.location.pathname !== '/login') await cargarDatos()

  const { usuario, moneda, budget, remindDaily, remindHour } = useDatos()
  let t: ReturnType<typeof setTimeout> | null = null
  const persist = () => {
    if (!_loaded.value) return
    if (t) clearTimeout(t)
    t = setTimeout(() => {
      guardarPerfil({
        name: usuario.value.name,
        photo: usuario.value.photo,
        moneda: moneda.value,
        budget: budget.value,
        remindDaily: remindDaily.value,
        remindHour: remindHour.value,
      })
    }, 500)
  }
  watch([() => usuario.value.name, () => usuario.value.photo, moneda, budget, remindDaily, remindHour], persist)
})
