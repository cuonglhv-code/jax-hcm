import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEmployee, useCreateEmployee, useUpdateEmployee, useDepartments, useJobTitles, useEmployees } from '@/hooks/useEmployees'
import { PageHeader } from '@/shared/components/PageHeader'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { FormField } from '@/shared/components/Form'
import { useToast } from '@/shared/components/Toast'
import { Skeleton } from '@/shared/components/Skeleton'

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  departmentId: z.string().uuid('Required'),
  jobTitle: z.string().min(1, 'Required'),
  managerId: z.string().optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contractor', 'intern']),
  hireDate: z.string().min(1, 'Required'),
  status: z.enum(['active', 'inactive', 'on_leave']),
})

type FormValues = z.infer<typeof schema>

export default function EmployeeFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: empData, isLoading: loadingEmp } = useEmployee(id)
  const { data: deptData } = useDepartments()
  const { data: empListData } = useEmployees({ limit: 100 })
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee()

  const emp = empData?.data
  const departments = deptData?.data ?? []
  const allEmployees = empListData?.data ?? []

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: emp ? {
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone ?? '',
      departmentId: emp.departmentId,
      jobTitle: emp.jobTitle,
      managerId: emp.managerId ?? '',
      employmentType: emp.employmentType,
      hireDate: emp.hireDate?.substring(0, 10) ?? '',
      status: emp.status,
    } : undefined,
  })

  const selectedDeptId = watch('departmentId')
  const { data: jobTitlesData } = useJobTitles(selectedDeptId)
  const jobTitles = jobTitlesData?.data ?? []

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit) {
        const res = await updateEmployee.mutateAsync({ id, ...values })
        toast({ message: 'Employee updated', variant: 'success' })
        navigate(`/employees/${res.data?.id ?? id}`)
      } else {
        const res = await createEmployee.mutateAsync(values)
        toast({ message: 'Employee created', variant: 'success' })
        navigate(`/employees/${res.data?.id}`)
      }
    } catch (err: any) {
      toast({ message: err?.response?.data?.message ?? 'Something went wrong', variant: 'error' })
    }
  }

  if (isEdit && loadingEmp) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton variant="heading" />
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="rect" height="40px" />)}
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={isEdit ? 'Edit Employee' : 'Add Employee'}
        breadcrumbs={[{ label: 'Employees', href: '/employees' }, { label: isEdit ? 'Edit' : 'New' }]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal */}
        <div className="card space-y-4">
          <h2 className="font-display font-bold text-sm text-text-muted uppercase tracking-wide">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" {...register('firstName')} error={errors.firstName?.message} required />
            <Input label="Last Name" {...register('lastName')} error={errors.lastName?.message} required />
          </div>
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} required />
          <Input label="Phone" type="tel" {...register('phone')} error={errors.phone?.message} />
        </div>

        {/* Employment */}
        <div className="card space-y-4">
          <h2 className="font-display font-bold text-sm text-text-muted uppercase tracking-wide">Employment Details</h2>
          <Select
            label="Department"
            {...register('departmentId')}
            options={departments.map((d: any) => ({ value: d.id, label: d.name }))}
            error={errors.departmentId?.message}
            required
          />
          <Select
            label="Job Title"
            {...register('jobTitle')}
            options={jobTitles.length > 0
              ? jobTitles.map((jt: any) => ({ value: jt, label: jt }))
              : [{ value: '', label: 'Select department first' }]}
            error={errors.jobTitle?.message}
            required
          />
          <Select
            label="Manager"
            {...register('managerId')}
            options={[{ value: '', label: 'No manager' }, ...allEmployees.filter((e: any) => e.id !== id).map((e: any) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` }))]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Employment Type"
              {...register('employmentType')}
              options={[
                { value: 'full_time', label: 'Full Time' },
                { value: 'part_time', label: 'Part Time' },
                { value: 'contractor', label: 'Contractor' },
                { value: 'intern', label: 'Intern' },
              ]}
              error={errors.employmentType?.message}
              required
            />
            <Select
              label="Status"
              {...register('status')}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'on_leave', label: 'On Leave' },
              ]}
              error={errors.status?.message}
              required
            />
          </div>
          <FormField label="Hire Date" error={errors.hireDate?.message} required>
            <input type="date" {...register('hireDate')} className="w-full px-3 py-2 text-sm bg-surface-2 border border-border rounded-md text-text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </FormField>
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={isSubmitting}>{isEdit ? 'Save Changes' : 'Create Employee'}</Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
