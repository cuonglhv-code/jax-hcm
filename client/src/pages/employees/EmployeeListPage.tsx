import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Eye, Pencil, Users } from 'lucide-react'
import { useEmployees, useDepartments } from '@/hooks/useEmployees'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/shared/components/PageHeader'
import { Table } from '@/shared/components/Table'
import { Badge } from '@/shared/components/Badge'
import { Avatar } from '@/shared/components/Avatar'
import { Button } from '@/shared/components/Button'
import { Select } from '@/shared/components/Select'
import { EmptyState } from '@/shared/components/EmptyState'
import { Input } from '@/shared/components/Input'

const STATUS_BADGE: Record<string, 'success' | 'neutral' | 'warning'> = {
  active: 'success',
  inactive: 'neutral',
  on_leave: 'warning',
}

export default function EmployeeListPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isHrManager = user?.role === 'hr_manager' || user?.role === 'super_admin'

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useEmployees({ search, status: status || undefined, departmentId: departmentId || undefined, page, limit: 20 })
  const { data: deptData } = useDepartments()

  const employees = data?.data ?? []
  const meta = data?.meta
  const departments = deptData?.data ?? []

  const columns = [
    {
      key: 'name',
      header: 'Employee',
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${row.firstName} ${row.lastName}`} src={row.avatarUrl} size="sm" />
          <div>
            <div className="font-medium text-text-base text-sm">{row.firstName} {row.lastName}</div>
            <div className="text-xs text-text-muted">{row.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'department', header: 'Department', render: (row: any) => row.department?.name ?? '—' },
    { key: 'jobTitle', header: 'Job Title', render: (row: any) => row.jobTitle ?? '—' },
    {
      key: 'status',
      header: 'Status',
      render: (row: any) => (
        <Badge variant={STATUS_BADGE[row.status] ?? 'neutral'}>
          {row.status?.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'employmentType',
      header: 'Type',
      render: (row: any) => <Badge variant="neutral">{row.employmentType}</Badge>,
    },
    {
      key: 'hireDate',
      header: 'Hire Date',
      render: (row: any) => row.hireDate ? format(new Date(row.hireDate), 'dd MMM yyyy') : '—',
    },
    {
      key: 'actions',
      header: '',
      render: (row: any) => (
        <div className="flex items-center gap-1">
          <button
            onClick={e => { e.stopPropagation(); navigate(`/employees/${row.id}`) }}
            className="p-1.5 text-text-muted hover:text-primary hover:bg-surface-offset rounded-md transition-colors"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          {isHrManager && (
            <button
              onClick={e => { e.stopPropagation(); navigate(`/employees/${row.id}/edit`) }}
              className="p-1.5 text-text-muted hover:text-primary hover:bg-surface-offset rounded-md transition-colors"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Manage your workforce"
        actions={
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search employees…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-48"
            />
            {isHrManager && (
              <Button onClick={() => navigate('/employees/new')} size="sm">
                + Add Employee
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <Select
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'on_leave', label: 'On Leave' },
          ]}
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="w-40"
        />
        <Select
          options={[{ value: '', label: 'All Departments' }, ...departments.map((d: any) => ({ value: d.id, label: d.name }))]}
          value={departmentId}
          onChange={e => { setDepartmentId(e.target.value); setPage(1) }}
          className="w-48"
        />
      </div>

      <Table
        columns={columns}
        data={employees}
        isLoading={isLoading}
        emptyState={<EmptyState icon={Users} title="No employees found" description="Adjust filters or add a new employee." />}
        pagination={meta ? { page: meta.page, limit: meta.limit, total: meta.total, totalPages: meta.totalPages, onPageChange: setPage } : undefined}
      />
    </div>
  )
}
