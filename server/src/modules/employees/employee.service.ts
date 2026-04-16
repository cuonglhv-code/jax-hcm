import db from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, ConflictError } from '../../middleware/errorHandler';
import { getPagination, buildPaginationMeta } from '../../utils/pagination';
import { Request } from 'express';
import { AuthUser } from '@hcm/shared';

function generateEmployeeNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `EMP-${year}-${rand}`;
}

export const employeeService = {
  async list(req: Request) {
    const { page, limit, offset } = getPagination(req);
    const { search, departmentId, status, employmentType } = req.query;

    const query = db('employees')
      .join('departments', 'employees.department_id', 'departments.id')
      .join('job_titles', 'employees.job_title_id', 'job_titles.id')
      .leftJoin('employees as managers', 'employees.manager_id', 'managers.id')
      .whereNull('employees.deleted_at')
      .select(
        'employees.*',
        'departments.name as department_name',
        'departments.code as department_code',
        'job_titles.title as job_title',
        db.raw("CONCAT(managers.first_name, ' ', managers.last_name) as manager_name"),
      );

    if (search) {
      query.where((b) => {
        b.whereILike('employees.first_name', `%${search}%`)
          .orWhereILike('employees.last_name', `%${search}%`)
          .orWhereILike('employees.email', `%${search}%`)
          .orWhereILike('employees.employee_number', `%${search}%`);
      });
    }
    if (departmentId) query.where('employees.department_id', departmentId as string);
    if (status) query.where('employees.status', status as string);
    if (employmentType) query.where('employees.employment_type', employmentType as string);

    const [{ count }] = await query.clone().count('employees.id as count');
    const data = await query.orderBy('employees.last_name').limit(limit).offset(offset);

    return { data, meta: buildPaginationMeta(Number(count), page, limit) };
  },

  async getById(id: string) {
    const employee = await db('employees')
      .join('departments', 'employees.department_id', 'departments.id')
      .join('job_titles', 'employees.job_title_id', 'job_titles.id')
      .leftJoin('employees as managers', 'employees.manager_id', 'managers.id')
      .where('employees.id', id)
      .whereNull('employees.deleted_at')
      .select(
        'employees.*',
        'departments.name as department_name',
        'departments.code as department_code',
        'job_titles.title as job_title',
        db.raw("managers.id as manager_id_ref"),
        db.raw("CONCAT(managers.first_name, ' ', managers.last_name) as manager_name"),
        db.raw("managers.email as manager_email"),
      )
      .first();

    if (!employee) throw new NotFoundError('Employee');
    return employee;
  },

  async create(data: Record<string, unknown>, user: AuthUser) {
    // Check email uniqueness
    const existing = await db('employees').where({ email: data.email }).whereNull('deleted_at').first();
    if (existing) throw new ConflictError(`Employee with email ${data.email} already exists`);

    const id = uuidv4();
    const employeeNumber = generateEmployeeNumber();

    const [employee] = await db('employees').insert({
      id,
      employee_number: employeeNumber,
      first_name: data.firstName,
      last_name: data.lastName,
      email: (data.email as string).toLowerCase(),
      phone: data.phone,
      date_of_birth: data.dateOfBirth,
      gender: data.gender,
      nationality: data.nationality,
      address: data.address,
      department_id: data.departmentId,
      job_title_id: data.jobTitleId,
      manager_id: data.managerId,
      employment_type: data.employmentType || 'full_time',
      status: 'active',
      start_date: data.startDate,
    }).returning('*');

    // Audit log
    await employeeService.createAuditLog({
      entityType: 'employee',
      entityId: id,
      action: 'create',
      changedBy: user.id,
      newValue: employee,
    });

    return employee;
  },

  async update(id: string, data: Record<string, unknown>, user: AuthUser) {
    const previous = await employeeService.getById(id);

    const updates: Record<string, unknown> = { updated_at: new Date() };
    if (data.firstName !== undefined) updates.first_name = data.firstName;
    if (data.lastName !== undefined) updates.last_name = data.lastName;
    if (data.email !== undefined) updates.email = (data.email as string).toLowerCase();
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.dateOfBirth !== undefined) updates.date_of_birth = data.dateOfBirth;
    if (data.gender !== undefined) updates.gender = data.gender;
    if (data.nationality !== undefined) updates.nationality = data.nationality;
    if (data.address !== undefined) updates.address = data.address;
    if (data.departmentId !== undefined) updates.department_id = data.departmentId;
    if (data.jobTitleId !== undefined) updates.job_title_id = data.jobTitleId;
    if (data.managerId !== undefined) updates.manager_id = data.managerId;
    if (data.employmentType !== undefined) updates.employment_type = data.employmentType;
    if (data.status !== undefined) updates.status = data.status;
    if (data.startDate !== undefined) updates.start_date = data.startDate;
    if (data.endDate !== undefined) updates.end_date = data.endDate;

    const [updated] = await db('employees').where({ id }).update(updates).returning('*');

    await employeeService.createAuditLog({
      entityType: 'employee',
      entityId: id,
      action: 'update',
      changedBy: user.id,
      previousValue: previous,
      newValue: updated,
    });

    return updated;
  },

  async softDelete(id: string, user: AuthUser) {
    await employeeService.getById(id); // throws if not found
    await db('employees').where({ id }).update({
      deleted_at: new Date(),
      status: 'terminated',
      updated_at: new Date(),
    });
    await employeeService.createAuditLog({
      entityType: 'employee',
      entityId: id,
      action: 'delete',
      changedBy: user.id,
    });
  },

  async getOrgChart() {
    const employees = await db('employees')
      .whereNull('deleted_at')
      .where('status', 'active')
      .join('departments', 'employees.department_id', 'departments.id')
      .join('job_titles', 'employees.job_title_id', 'job_titles.id')
      .select(
        'employees.id',
        'employees.first_name',
        'employees.last_name',
        'employees.manager_id',
        'employees.avatar_url',
        'departments.name as department_name',
        'job_titles.title as job_title',
      )
      .orderBy('employees.last_name');

    return employees;
  },

  async getDocuments(employeeId: string) {
    await employeeService.getById(employeeId);
    return db('employee_documents')
      .where({ employee_id: employeeId })
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc');
  },

  async addDocument(
    employeeId: string,
    fileInfo: { name: string; type: string; path: string; size: number; mimeType: string },
    user: AuthUser,
  ) {
    const [doc] = await db('employee_documents').insert({
      id: uuidv4(),
      employee_id: employeeId,
      name: fileInfo.name,
      document_type: fileInfo.type,
      file_path: fileInfo.path,
      file_size: fileInfo.size,
      mime_type: fileInfo.mimeType,
      uploaded_by: user.id,
    }).returning('*');
    return doc;
  },

  async getAuditLog(employeeId: string, req: Request) {
    const { page, limit, offset } = getPagination(req);
    const query = db('audit_logs')
      .join('users', 'audit_logs.changed_by', 'users.id')
      .where({ entity_type: 'employee', entity_id: employeeId })
      .select(
        'audit_logs.*',
        db.raw("CONCAT(users.id) as changed_by_id"),
        db.raw("users.email as changed_by_email"),
      );

    const [{ count }] = await query.clone().count('audit_logs.id as count');
    const data = await query.orderBy('audit_logs.created_at', 'desc').limit(limit).offset(offset);
    return { data, meta: buildPaginationMeta(Number(count), page, limit) };
  },

  async createAuditLog(params: {
    entityType: string;
    entityId: string;
    action: string;
    changedBy: string;
    previousValue?: unknown;
    newValue?: unknown;
  }) {
    await db('audit_logs').insert({
      id: uuidv4(),
      entity_type: params.entityType,
      entity_id: params.entityId,
      action: params.action,
      changed_by: params.changedBy,
      previous_value: params.previousValue ? JSON.stringify(params.previousValue) : null,
      new_value: params.newValue ? JSON.stringify(params.newValue) : null,
    });
  },

  async getDepartments() {
    return db('departments').whereNull('deleted_at').orderBy('name');
  },

  async getJobTitles(departmentId?: string) {
    const query = db('job_titles').whereNull('deleted_at').orderBy('title');
    if (departmentId) query.where({ department_id: departmentId });
    return query;
  },
};
