import { db } from '../../config/database'
import { AppError } from '../../middleware/errorHandler'

export const learningService = {
  // ─── Courses ─────────────────────────────────────────────────────────
  async listCourses(
    filters: { type?: string; isMandatory?: string; search?: string },
    page = 1,
    limit = 20
  ) {
    const query = db('courses').whereNull('deleted_at').orderBy('title', 'asc')

    if (filters.type) query.where('type', filters.type)
    if (filters.isMandatory !== undefined)
      query.where('is_mandatory', filters.isMandatory === 'true')
    if (filters.search) query.where('title', 'ilike', `%${filters.search}%`)

    const { data, pagination } = await paginateQuery(query, page, limit)
    return { data, total: pagination.total }
  },

  async getCourse(id: string) {
    const course = await db('courses').where({ id }).whereNull('deleted_at').first()
    if (!course) throw new AppError(404, 'Course not found')
    return course
  },

  async createCourse(data: any) {
    const [course] = await db('courses')
      .insert({
        title: data.title,
        description: data.description,
        type: data.type,
        provider: data.provider,
        duration_hours: data.durationHours,
        is_mandatory: data.isMandatory,
      })
      .returning('*')
    return course
  },

  async updateCourse(id: string, data: any) {
    const [course] = await db('courses')
      .where({ id })
      .update({
        title: data.title,
        description: data.description,
        type: data.type,
        provider: data.provider,
        duration_hours: data.durationHours,
        is_mandatory: data.isMandatory,
        updated_at: db.fn.now(),
      })
      .returning('*')
    if (!course) throw new AppError(404, 'Course not found')
    return course
  },

  async deleteCourse(id: string) {
    const deleted = await db('courses').where({ id }).update({ deleted_at: db.fn.now() })
    if (!deleted) throw new AppError(404, 'Course not found')
  },

  // ─── Enrolments ──────────────────────────────────────────────────────
  async enrolEmployee(data: any) {
    const existing = await db('course_enrolments')
      .where({ course_id: data.courseId, employee_id: data.employeeId })
      .whereIn('status', ['enrolled', 'in_progress'])
      .first()
    if (existing) throw new AppError(409, 'Employee is already enrolled in this course')

    const [enrolment] = await db('course_enrolments')
      .insert({
        course_id: data.courseId,
        employee_id: data.employeeId,
        expires_at: data.expiresAt,
        status: 'enrolled',
      })
      .returning('*')
    return enrolment
  },

  async updateEnrolmentStatus(id: string, status: string) {
    return await db.transaction(async trx => {
      const enrolment = await trx('course_enrolments').where({ id }).first()
      if (!enrolment) throw new AppError(404, 'Enrolment not found')

      const updates: any = { status, updated_at: db.fn.now() }

      if (status === 'in_progress' && !enrolment.started_at) {
        updates.started_at = db.fn.now()
      }

      if (status === 'completed' && enrolment.status !== 'completed') {
        updates.completed_at = db.fn.now()
      }

      const [updated] = await trx('course_enrolments').where({ id }).update(updates).returning('*')

      if (status === 'completed' && enrolment.status !== 'completed') {
        await learningService.generateCertificate(id, trx)
      }

      return updated
    })
  },

  async listEnrolmentsByEmployee(employeeId: string, status?: string) {
    const query = db('course_enrolments')
      .join('courses', 'course_enrolments.course_id', 'courses.id')
      .select('course_enrolments.*', 'courses.title as course_title', 'courses.type as course_type')
      .where('course_enrolments.employee_id', employeeId)
      .orderBy('course_enrolments.created_at', 'desc')

    if (status) query.where('course_enrolments.status', status)
    return await query
  },

  async listEnrolmentsByCourse(courseId: string, page = 1, limit = 20) {
    const query = db('course_enrolments')
      .join('employees', 'course_enrolments.employee_id', 'employees.id')
      .select(
        'course_enrolments.*',
        'employees.first_name',
        'employees.last_name',
        'employees.email'
      )
      .where('course_enrolments.course_id', courseId)
      .orderBy('course_enrolments.created_at', 'desc')

    const { data, pagination } = await paginateQuery(query, page, limit)
    return { data, total: pagination.total }
  },

  // ─── Certificates ────────────────────────────────────────────────────
  async generateCertificate(enrolmentId: string, trx = db) {
    const existing = await trx('training_certificates').where({ enrolment_id: enrolmentId }).first()
    if (existing) return existing

    const enrolment = await trx('course_enrolments').where({ id: enrolmentId }).first()
    if (!enrolment) throw new AppError(404, 'Enrolment not found')

    const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(16).substring(2, 8).toUpperCase()}`

    const [cert] = await trx('training_certificates')
      .insert({
        enrolment_id: enrolmentId,
        employee_id: enrolment.employee_id,
        course_id: enrolment.course_id,
        certificate_number: certificateNumber,
        issued_at: db.fn.now(),
      })
      .returning('*')
    return cert
  },

  async getCertificate(id: string) {
    const cert = await db('training_certificates')
      .join('courses', 'training_certificates.course_id', 'courses.id')
      .join('employees', 'training_certificates.employee_id', 'employees.id')
      .select(
        'training_certificates.*',
        'courses.title as course_title',
        'employees.first_name as employee_first_name',
        'employees.last_name as employee_last_name'
      )
      .where('training_certificates.id', id)
      .first()
    if (!cert) throw new AppError(404, 'Certificate not found')
    return cert
  },

  async getCertificateDataForPdf(id: string) {
    const cert = await learningService.getCertificate(id)
    return {
      employeeName: `${cert.employee_first_name} ${cert.employee_last_name}`,
      courseName: cert.course_title,
      completionDate: cert.issued_at.toISOString(),
      certificateNumber: cert.certificate_number,
    }
  },

  // ─── Learning Plans ──────────────────────────────────────────────────
  async listPlans(page = 1, limit = 20) {
    const query = db('learning_plans').orderBy('created_at', 'desc')
    const { data, pagination } = await paginateQuery(query, page, limit)
    return { data, total: pagination.total }
  },

  async getPlan(id: string) {
    const plan = await db('learning_plans').where({ id }).first()
    if (!plan) throw new AppError(404, 'Learning plan not found')

    const items = await db('learning_plan_items')
      .join('courses', 'learning_plan_items.course_id', 'courses.id')
      .select('learning_plan_items.*', 'courses.title as course_title')
      .where('learning_plan_items.plan_id', id)
      .orderBy('learning_plan_items.order', 'asc')

    return { ...plan, items }
  },

  async createPlan(data: any, createdById: string) {
    return await db.transaction(async trx => {
      const [plan] = await trx('learning_plans')
        .insert({
          name: data.name,
          assigned_to_employee_id: data.assignedToEmployeeId || null,
          assigned_to_job_title_id: data.assignedToJobTitleId || null,
          created_by_id: createdById,
        })
        .returning('*')

      let insertedItems: any[] = []
      if (data.items && data.items.length > 0) {
        const itemRows = data.items.map((item: any) => ({
          plan_id: plan.id,
          course_id: item.courseId,
          order: item.order,
          is_required: item.isRequired,
        }))
        insertedItems = await trx('learning_plan_items').insert(itemRows).returning('*')
      }

      return { ...plan, items: insertedItems }
    })
  },

  async updatePlanItems(planId: string, items: any[]) {
    await db.transaction(async trx => {
      const plan = await trx('learning_plans').where({ id: planId }).first()
      if (!plan) throw new AppError(404, 'Learning plan not found')

      await trx('learning_plan_items').where({ plan_id: planId }).del()

      if (items && items.length > 0) {
        const itemRows = items.map((item: any) => ({
          plan_id: planId,
          course_id: item.courseId,
          order: item.order,
          is_required: item.isRequired,
        }))
        await trx('learning_plan_items').insert(itemRows)
      }

      await trx('learning_plans').where({ id: planId }).update({ updated_at: db.fn.now() })
    })
  },

  // ─── Mandatory Training ──────────────────────────────────────────────
  async listMandatoryTraining() {
    return await db('mandatory_training')
      .join('courses', 'mandatory_training.course_id', 'courses.id')
      .leftJoin('departments', 'mandatory_training.department_id', 'departments.id')
      .leftJoin('job_titles', 'mandatory_training.job_title_id', 'job_titles.id')
      .select(
        'mandatory_training.*',
        'courses.title as course_title',
        'departments.name as department_name',
        'job_titles.title as job_title_name'
      )
  },

  async createMandatoryTraining(data: any) {
    const [rule] = await db('mandatory_training')
      .insert({
        course_id: data.courseId,
        department_id: data.departmentId || null,
        job_title_id: data.jobTitleId || null,
        renewal_period_days: data.renewalPeriodDays || null,
      })
      .returning('*')
    return rule
  },

  async deleteMandatoryTraining(id: string) {
    const deleted = await db('mandatory_training').where({ id }).del()
    if (!deleted) throw new AppError(404, 'Mandatory training rule not found')
  },

  async getMandatoryTrainingStatus(employeeId: string) {
    const emp = await db('employees').where({ id: employeeId }).first()
    if (!emp) throw new AppError(404, 'Employee not found')

    // Get rules applicable to employee (either by dept, job title, or global)
    const rules = await db('mandatory_training')
      .join('courses', 'mandatory_training.course_id', 'courses.id')
      .select('mandatory_training.*', 'courses.title as course_title')
      .where('department_id', emp.department_id)
      .orWhere('job_title_id', emp.job_title_id)
      .orWhere(function () {
        this.whereNull('department_id').whereNull('job_title_id')
      })

    // Get all enrolments for this employee
    const enrolments = await db('course_enrolments').where({ employee_id: employeeId })

    const statusList = rules.map(rule => {
      // Find latest completed enrolment for this course
      const courseEnrolments = enrolments.filter(
        e => e.course_id === rule.course_id && e.status === 'completed'
      )
      courseEnrolments.sort(
        (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
      )

      const latest = courseEnrolments[0]

      let status = 'not_started'
      let expiresAt = null

      if (latest) {
        if (rule.renewal_period_days) {
          const completedAt = new Date(latest.completed_at)
          const expiryDate = new Date(
            completedAt.getTime() + rule.renewal_period_days * 24 * 60 * 60 * 1000
          )
          expiresAt = expiryDate.toISOString()

          const now = new Date()
          const msUntilExpiry = expiryDate.getTime() - now.getTime()
          const daysUntilExpiry = msUntilExpiry / (1000 * 60 * 60 * 24)

          if (msUntilExpiry < 0) {
            status = 'overdue'
          } else if (daysUntilExpiry <= 30) {
            status = 'expiring_soon'
          } else {
            status = 'current'
          }
        } else {
          status = 'current' // no expiry
        }
      } else {
        // Check if they are at least enrolled or in_progress
        const active = enrolments.find(
          e => e.course_id === rule.course_id && ['enrolled', 'in_progress'].includes(e.status)
        )
        if (active) status = active.status
      }

      return {
        courseId: rule.course_id,
        courseTitle: rule.course_title,
        status,
        completedAt: latest ? latest.completed_at : null,
        expiresAt,
        renewalPeriodDays: rule.renewal_period_days,
      }
    })

    return statusList
  },
}

async function paginateQuery(query: any, page: number, limit: number) {
  const result = await query.clone().clearSelect().clear('order').count('* as total').first()
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
