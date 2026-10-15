import { updateProfile } from '../utils/data'
import { requireUser } from '../utils/session'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const patch = await readBody(event)
  await updateProfile(user.id, patch || {})
  return { ok: true }
})
