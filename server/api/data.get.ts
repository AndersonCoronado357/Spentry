import { getAllData } from '../utils/data'
import { requireUser } from '../utils/session'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  return getAllData(user.id, user)
})
