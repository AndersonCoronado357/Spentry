// Protege las páginas privadas: sin sesión → al login. La página /login es pública.
export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return
  const { data } = await useFetch('/api/auth/me', { key: 'auth-me' })
  if (!data.value?.user) return navigateTo('/login')
})
