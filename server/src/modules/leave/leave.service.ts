import { db } from '../../config/database'
import { AppError } from '../../middleware/errorHandler'

export const leaveService = {
  // ─── Leave Types & Entitlements ──────────────────────────────────────
  async listLeaveTypes() {
    return await db('leave_types').orderBy('name', 'asc')
  },

  async createLeaveType(data: any) {
    const [type] = await db('leave_types')
      .insert({
        name: data.name,
        is_paid: data.isPaid,
        default_days: data.defaultDays,
        allow_carry_over: data.allowCarryOver,
        max_carry_over_days: data.maxCarryOverDays,
      })
      .returning('*')
    return type
  },

  async updateLeaveType(id: string, data: any) {
    const [type] = await db('leave_types')
      .where({ id })
      .update({
        name: data.name,
        is_paid: data.isPaid,
        default_days: data.defaultDays,
        allow_carry_over: data.allowCarryOver,
        max_carry_over_days: data.maxCarryOverDays,
        updated_at: db.fn.now(),
      })
      .returning('*')
    if (!type) throw new AppError(404, 'Leave type not found')
    return type
  },

  async getEntitlements(employeeId: string, year: number) {
    return await db('leave_entitlements')
      .join('leave_types', 'leave_entitlements.leave_type_id', 'leave_types.id')
      .select('leave_entitlements.*', 'leave_types.name as leave_type_name')
      .where({ employee_id: employeeId, year })
  },

  async createEntitlement(data: any) {
    const existing = await db('leave_entitlements')
      .where({
        employee_id: data.employeeId,
        leave_type_id: data.leaveTypeId,
        year: data.year,
      })
      .first()
    if (existing) throw new AppError(409, 'Entitlement already exists for this type and year')

    const [entitlement] = await db('leave_entitlements')
      .insert({
        employee_id: data.employeeId,
        leave_type_id: data.leaveTypeId,
        year: data.year,
        total_days: data.totalDays,
        carry_over_days: data.carryOverDays,
      })
      .returning('*')
    return entitlement
  },

  async getLeaveBalance(employeeId: string, year: number) {
    const entitlements = await db('leave_entitlements')
      .join('leave_types', 'leave_entitlements.leave_type_id', 'leave_types.id')
      .select('leave_entitlements.*', 'leave_types.name as leave_type_name')
      .where({ employee_id: employeeId, year })

    const result: Array<{
      leaveTypeId: string
      leaveTypeName: string
      totalDays: number
      usedDays: number
      remainingDays: number
    }> = []

    for (const ent of entitlements) {
      const usedResult = await db('leave_requests')
        .where({
          employee_id: employeeId,
          leave_type_id: ent.leave_type_id,
          status: 'approved',
        })
        .where(db.raw(`EXTRACT(YEAR FROM start_date) = ?`, [year]))
        .sum('days as total')
        .first()

      const total = Number(ent.total_days) + Number(ent.carry_over_days || 0)
      const used = Number(usedResult?.total || 0)

      result.push({
        leaveTypeId: ent.leave_type_id,
        leaveTypeName: ent.leave_type_name,
        totalDays: total,
        usedDays: used,
        remainingDays: total - used,
      })
    }

    return result
  },

  // ─── Leave Requests ──────────────────────────────────────────────────
  async listLeaveRequests(
    filters: { employeeId?: string; status?: string; year?: string },
    page = 1,
    limit = 20
  ) {
    const query = db('leave_requests')
      .join('leave_types', 'leave_requests.leave_type_id', 'leave_types.id')
      .join('employees', 'leave_requests.employee_id', 'employees.id')
      .select(
        'leave_requests.*',
        'leave_types.name as leave_type_name',
        'employees.first_name',
        'employees.last_name'
      )
      .orderBy('leave_requests.created_at', 'desc')

    if (filters.employeeId) query.where('leave_requests.employee_id', filters.employeeId)
    if (filters.status) query.where('leave_requests.status', filters.status)
    if (filters.year)
      query.where(db.raw(`EXTRACT(YEAR FROM leave_requests.start_date) = ?`, [filters.year]))

    const { data, pagination } = await paginateQuery(query, page, limit)
    return { data, total: pagination.total }
  },

  async getLeaveRequest(id: string) {
    const request = await db('leave_requests')
      .join('leave_types', 'leave_requests.leave_type_id', 'leave_types.id')
      .join('employees', 'leave_requests.employee_id', 'employees.id')
      .select(
        'leave_requests.*',
        'leave_types.name as leave_type_name',
        'employees.first_name',
        'employees.last_name'
      )
      .where('leave_requests.id', id)
      .first()
    if (!request) throw new AppError(404, 'Leave request not found')
    return request
  },

  async createLeaveRequest(employeeId: string, data: any) {
    return await db.transaction(async trx => {
      const startDate = new Date(data.startDate)
      const endDate = new Date(data.endDate)
      const year = startDate.getFullYear()

      // Calculation logic
      // In a real application, you'd calculate exact working days excluding GB public holidays
      // Placeholder: straight difference in days for now or 1 if same day
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // Basic calculation

      const balances = await leaveService.getLeaveBalance(employeeId, year)
      const balance = balances.find(b => b.leaveTypeId === data.leaveTypeId)

      if (!balance || balance.remainingDays < days) {
        throw new AppError(400, 'Insufficient leave balance')
      }

      // Check overlap
      const overlaps = await trx('leave_requests')
        .where({ employee_id: employeeId })
        .whereIn('status', ['approved', 'pending'])
        .andWhere(function () {
          this.where('start_date', '<=', data.endDate).andWhere('end_date', '>=', data.startDate)
        })

      if (overlaps.length > 0) {
        throw new AppError(409, 'Overlapping leave request')
      }

      const [request] = await trx('leave_requests')
        .insert({
          employee_id: employeeId,
          leave_type_id: data.leaveTypeId,
          start_date: data.startDate,
          end_date: data.endDate,
          days,
          reason: data.reason,
          status: 'pending',
        })
        .returning('*')
      return request
    })
  },

  async reviewLeaveRequest(id: string, action: string, reviewerId: string) {
    return await db.transaction(async trx => {
      const request = await trx('leave_requests').where({ id }).first()
      if (!request) throw new AppError(404, 'Leave request not found')
      if (request.status !== 'pending') throw new AppError(400, 'Leave request is not pending')

      if (action === 'approve') {
        const overlaps = await trx('leave_requests')
          .where({ employee_id: request.employee_id })
          .whereIn('status', ['approved', 'pending'])
          .andWhere('id', '!=', id)
          .andWhere(function () {
            this.where('start_date', '<=', request.end_date).andWhere(
              'end_date',
              '>=',
              request.start_date
            )
          })

        if (overlaps.length > 0) {
          throw new AppError(409, 'Overlapping leave request detected during review')
        }

        const year = new Date(request.start_date).getFullYear()
        await trx('leave_entitlements')
          .where({ employee_id: request.employee_id, leave_type_id: request.leave_type_id, year })
          .update({
            used_days: db.raw(`used_days + ?`, [request.days]),
            updated_at: db.fn.now(),
          })
      }

      const [updated] = await trx('leave_requests')
        .where({ id })
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_by_id: reviewerId,
          reviewed_at: db.fn.now(),
          updated_at: db.fn.now(),
        })
        .returning('*')
      return updated
    })
  },

  async cancelLeaveRequest(id: string, requesterEmployeeId: string) {
    return await db.transaction(async trx => {
      const request = await trx('leave_requests').where({ id }).first()
      if (!request) throw new AppError(404, 'Leave request not found')
      if (request.employee_id !== requesterEmployeeId)
        throw new AppError(403, 'Not authorized to cancel this request')
      if (request.status !== 'pending')
        throw new AppError(400, 'Only pending requests can be cancelled')

      await trx('leave_requests')
        .where({ id })
        .update({ status: 'cancelled', updated_at: db.fn.now() })
    })
  },

  // ─── Calendar ────────────────────────────────────────────────────────
  async getTeamCalendar(managerId: string, month: number, year: number) {
    // Basic calendar fetching
    const firstDay = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const lastDay = new Date(year, month, 0).toISOString().split('T')[0]

    const reports = await db('employees').where({ manager_id: managerId }).select('id')
    const reportIds = reports.map(r => r.id)

    const leaves = await db('leave_requests')
      .join('employees', 'leave_requests.employee_id', 'employees.id')
      .join('leave_types', 'leave_requests.leave_type_id', 'leave_types.id')
      .select(
        'employees.first_name',
        'employees.last_name',
        'leave_types.name as leave_type',
        'leave_requests.start_date',
        'leave_requests.end_date'
      )
      .whereIn('leave_requests.employee_id', reportIds)
      .where('leave_requests.status', 'approved')
      .andWhere(function () {
        this.where('start_date', '<=', lastDay).andWhere('end_date', '>=', firstDay)
      })

    const publicHols = await leaveService.listPublicHolidays('GB', year)

    const formattedLeaves = leaves.map(l => ({
      employeeName: `${l.first_name} ${l.last_name}`,
      leaveType: l.leave_type,
      startDate: l.start_date,
      endDate: l.end_date,
      type: 'leave',
    }))

    const formattedHols = publicHols.map(h => ({
      employeeName: 'Public Holiday',
      leaveType: h.name,
      startDate: h.date,
      endDate: h.date,
      type: 'public_holiday',
    }))

    return [...formattedLeaves, ...formattedHols]
  },

  // ─── Public Holidays ─────────────────────────────────────────────────
  async listPublicHolidays(region: string, year: number) {
    return await db('public_holidays').where({ region, year }).orderBy('date', 'asc')
  },

  async createPublicHoliday(data: any) {
    const year = new Date(data.date).getFullYear()
    const [holiday] = await db('public_holidays')
      .insert({
        name: data.name,
        date: data.date,
        region: data.region || 'GB',
        year,
      })
      .returning('*')
    return holiday
  },

  async deletePublicHoliday(id: string) {
    await db('public_holidays').where({ id }).del()
  },

  // ─── Attendance ──────────────────────────────────────────────────────
  async clockIn(employeeId: string, dateStr?: string, notes?: string) {
    const date = dateStr
      ? new Date(dateStr).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]

    const existing = await db('attendance_logs').where({ employee_id: employeeId, date }).first()

    if (existing) throw new AppError(409, 'Already clocked in today')

    const [log] = await db('attendance_logs')
      .insert({
        employee_id: employeeId,
        date,
        clock_in: db.fn.now(),
        notes,
      })
      .returning('*')
    return log
  },

  async clockOut(employeeId: string) {
    const today = new Date().toISOString().split('T')[0]
    const log = await db('attendance_logs')
      .where({ employee_id: employeeId, date: today })
      .whereNull('clock_out')
      .first()

    if (!log) throw new AppError(400, 'Not clocked in')

    // Basic calculation
    return await db.transaction(async trx => {
      // Calculate diff directly using pg function or js. JS:
      const now = new Date()
      const clockedInTimestamp = new Date(log.clock_in).getTime()
      const hours = (now.getTime() - clockedInTimestamp) / (1000 * 60 * 60)

      const [updated] = await trx('attendance_logs')
        .where({ id: log.id })
        .update({
          clock_out: db.fn.now(),
          total_hours: parseFloat(hours.toFixed(2)),
          updated_at: db.fn.now(),
        })
        .returning('*')
      return updated
    })
  },

  async listAttendance(employeeId: string, from?: string, to?: string, page = 1, limit = 20) {
    const query = db('attendance_logs').where({ employee_id: employeeId }).orderBy('date', 'desc')

    if (from) query.where('date', '>=', from)
    if (to) query.where('date', '<=', to)

    const { data, pagination } = await paginateQuery(query, page, limit)
    return { data, total: pagination.total }
  },

  async exportAttendanceCSV(employeeId: string, from?: string, to?: string) {
    const query = db('attendance_logs').where({ employee_id: employeeId }).orderBy('date', 'asc')

    if (from) query.where('date', '>=', from)
    if (to) query.where('date', '<=', to)

    const data = await query
    let csv = 'date,clock_in,clock_out,total_hours,notes\n'
    data.forEach(row => {
      csv += `${new Date(row.date).toISOString().split('T')[0]},${row.clock_in},${row.clock_out || ''},${row.total_hours || ''},"${row.notes || ''}"\n`
    })
    return csv
  },
}

async function paginateQuery(query: any, page: number, limit: number) {
  const result = await query.clone().clearSelect().count('* as total').first()
  const totalItems = Number((result as { total: string | number }).total ?? 0)
  const data = await query.offset((page - 1) * limit).limit(limit)
  return {
    data,
    pagination: {
      page,
      limit,
      total: totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  }
}
