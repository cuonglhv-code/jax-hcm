import db from '../../config/database'
import { AppError } from '../../middleware/errorHandler'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

export const adminService = {
  async getSystemStats() {
    const [
      [totalUsers], [totalEmployees], [activeEmployees], [totalDepartments],
      [totalRequisitions], [openRequisitions], [totalCourses], [totalEnrolments],
      [pendingLeave], currentRun,
    ] = await Promise.all([
      db('users').whereNull('deleted_at').count('id as count'),
      db('employees').whereNull('deleted_at').count('id as count'),
      db('employees').where({ status: 'active' }).whereNull('deleted_at').count('id as count'),
      db('departments').whereNull('deleted_at').count('id as count'),
      db('job_requisitions').whereNull('deleted_at').count('id as count'),
      db('job_requisitions').where({ status: 'open' }).whereNull('deleted_at').count('id as count'),
      db('courses').whereNull('deleted_at').count('id as count'),
      db('course_enrolments').count('id as count'),
      db('leave_requests').where({ status: 'pending' }).count('id as count'),
      db('payroll_runs').whereNull('deleted_at').orderBy('created_at', 'desc').select('name', 'status').first(),
    ])
    return {
      totalUsers: Number(totalUsers.count),
      totalEmployees: Number(totalEmployees.count),
      activeEmployees: Number(activeEmployees.count),
      totalDepartments: Number(totalDepartments.count),
      totalRequisitions: Number(totalRequisitions.count),
      openRequisitions: Number(openRequisitions.count),
      totalCourses: Number(totalCourses.count),
      totalEnrolments: Number(totalEnrolments.count),
      pendingLeaveRequests: Number(pendingLeave.count),
      currentPayrollRun: currentRun ?? null,
    }
  },

  async listUsers(page: number, limit: number, search?: string) {
    const offset = (page - 1) * limit
    const query = db('users')
      .whereNull('users.deleted_at')
      .leftJoin('employees', 'users.id', 'employees.user_id')
      .leftJoin('departments', 'employees.department_id', 'departments.id')
      .select(
        'users.id', 'users.email', 'users.role', 'users.is_active', 'users.last_login_at', 'users.created_at',
        'employees.first_name', 'employees.last_name',
        'departments.name as department_name',
      )

    if (search) {
      query.where(function () {
        this.whereRaw('users.email ILIKE ?', [`%${search}%`])
          .orWhereRaw('employees.first_name ILIKE ?', [`%${search}%`])
          .orWhereRaw('employees.last_name ILIKE ?', [`%${search}%`])
      })
    }

    const [{ count }] = await query.clone().count('users.id as count')
    const data = await query.orderBy('users.created_at', 'desc').limit(limit).offset(offset)
    return { data, total: Number(count) }
  },

  async getUserById(id: string) {
    const user = await db('users')
      .where('users.id', id)
      .whereNull('users.deleted_at')
      .leftJoin('employees', 'users.id', 'employees.user_id')
      .leftJoin('departments', 'employees.department_id', 'departments.id')
      .select(
        'users.id', 'users.email', 'users.role', 'users.is_active', 'users.last_login_at',
        'employees.first_name', 'employees.last_name',
        'departments.name as department_name',
      )
      .first()
    if (!user) throw new AppError(404, 'User not found')
    return user
  },

  async updateUser(id: string, requesterId: string, data: { role?: string; is_active?: boolean }) {
    if (id === requesterId && data.role !== undefined) {
      const self = await db('users').where({ id }).first()
      if (self?.role === 'super_admin' && data.role !== 'super_admin') {
        throw new AppError(400, 'Cannot demote your own super_admin role')
      }
    }
    if (id === requesterId && data.is_active === false) {
      throw new AppError(400, 'Cannot deactivate your own account')
    }
    const [updated] = await db('users').where({ id }).update({ ...data, updated_at: new Date() }).returning('*')
    if (!updated) throw new AppError(404, 'User not found')
    return updated
  },

  async resetUserPassword(id: string, newPassword: string) {
    const hash = await bcrypt.hash(newPassword, 12)
    await db('users').where({ id }).update({ password_hash: hash, updated_at: new Date() })
    await db('refresh_tokens').where({ user_id: id }).update({ revoked_at: new Date() })
  },

  async deleteUser(id: string, requesterId: string) {
    if (id === requesterId) throw new AppError(400, 'Cannot delete your own account')
    await db('users').where({ id }).update({ deleted_at: new Date(), is_active: false })
  },

  async getActivityLog(page: number, limit: number) {
    const offset = (page - 1) * limit
    const query = db('audit_logs')
      .leftJoin('users', 'audit_logs.performed_by', 'users.id')
      .select('audit_logs.*', 'users.email as actor_email')
      .orderBy('audit_logs.created_at', 'desc')

    const [{ count }] = await query.clone().count('audit_logs.id as count')
    const data = await query.limit(limit).offset(offset)
    return { data, total: Number(count) }
  },
}
