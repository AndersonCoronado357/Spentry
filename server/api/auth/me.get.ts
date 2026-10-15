export default defineEventHandler((event) => {
  const user = event.context.user as Record<string, unknown> | null
  if (!user) return { user: null }
  const { password_hash, ...safe } = user
  return { user: safe }
})
