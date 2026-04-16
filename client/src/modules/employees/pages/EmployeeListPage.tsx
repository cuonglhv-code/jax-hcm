import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Network, Filter } from 'lucide-react';
import api from '../../../services/api';
import { Button } from '../../../components/Button';
import { Table, Pagination } from '../../../components/Table';
import { Badge, statusVariant } from '../../../components/Badge';
import { Avatar } from '../../../components/Avatar';
import type { Employee } from '@hcm/shared';

export function EmployeeListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page, search, deptFilter],
    queryFn: () =>
      api
        .get('/employees', { params: { page, limit: 20, search: search || undefined, departmentId: deptFilter || undefined } })
        .then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const { data: depts } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/employees/departments').then((r) => r.data.data),
  });

  const employees: Employee[] = data?.data ?? [];
  const meta = data?.meta;

  const columns = [
    {
      key: 'name',
      header: 'Employee',
      render: (emp: Employee) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${emp.firstName} ${emp.lastName}`} src={emp.avatarUrl} size="sm" />
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {emp.firstName} {emp.lastName}
            </div>
            <div className="text-xs text-gray-400">{emp.employeeNumber}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'department_name',
      header: 'Department',
      render: (emp: Employee & { department_name?: string }) => (
        <span className="text-gray-600 dark:text-gray-400">{emp.department_name ?? '—'}</span>
      ),
    },
    {
      key: 'job_title',
      header: 'Job Title',
      render: (emp: Employee & { job_title?: string }) => emp.job_title ?? '—',
    },
    {
      key: 'employmentType',
      header: 'Type',
      render: (emp: Employee) => (
        <Badge variant="info">{emp.employmentType.replace('_', ' ')}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (emp: Employee) => (
        <Badge variant={statusVariant(emp.status)} dot>
          {emp.status}
        </Badge>
      ),
    },
    {
      key: 'startDate',
      header: 'Start Date',
      render: (emp: Employee) => new Date(emp.startDate).toLocaleDateString('en-GB'),
    },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Employees</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {meta?.total ?? 0} team members
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={<Network className="size-4" />}
            onClick={() => navigate('/employees/org-chart')}>
            Org Chart
          </Button>
          <Button size="sm" icon={<Plus className="size-4" />}
            onClick={() => {}}>
            Add Employee
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search by name, email, number…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-gray-400" />
          <select
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          >
            <option value="">All departments</option>
            {(depts ?? []).map((d: { id: string; name: string }) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <Table
          columns={columns as never}
          data={employees as never}
          loading={isLoading}
          onRowClick={(emp) => navigate(`/employees/${emp.id}`)}
          emptyMessage="No employees found"
        />
        {meta && (
          <div className="px-4 pb-4">
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={meta.limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
