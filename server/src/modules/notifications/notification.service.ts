import db from '../../config/database'
import { AppError } from '../../middleware/errorHandler'
import { v4 as uuidv4 } from 'uuid'

export const notificationService = {
  async createNotification(userId: string, type: string, message: string, link?: string) {
    const [n] = await db('notifications').insert({
      id: uuidv4(),
      user_id: userId,
      type,
      message,
      link: link ?? null,
    }).returning('*')
    return n
  },

  async getNotifications(userId: string, unreadOnly?: boolean, page = 1, limit = 20) {
    const offset = (page - 1) * limit
    const query = db('notifications').where({ user_id: userId })
    if (unreadOnly) query.whereNull('read_at')
    const [{ count }] = await query.clone().count('id as count')
    const [{ unreadCount }] = await db('notifications').where({ user_id: userId }).whereNull('read_at').count('id as unreadCount')
    const data = await query.orderBy('created_at', 'desc').limit(limit).offset(offset)
    return { data, total: Number(count), unreadCount: Number(unreadCount) }
  },

  async markAsRead(notificationId: string, userId: string) {
    const n = await db('notifications').where({ id: notificationId, user_id: userId }).first()
    if (!n) throw new AppError(404, 'Notification not found')
    await db('notifications').where({ id: notificationId }).update({ read_at: new Date() })
  },

  async markAllAsRead(userId: string) {
    await db('notifications').where({ user_id: userId }).whereNull('read_at').update({ read_at: new Date() })
  },

  async deleteNotification(id: string, userId: string) {
    await db('notifications').where({ id, user_id: userId }).del()
  },
}
