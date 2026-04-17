import React, { useState } from 'react'
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment, useEmployees } from '@/hooks/useEmployees'
import { PageHeader } from '@/shared/components/PageHeader'
import { Table } from '@/shared/components/Table'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { Avatar } from '@/shared/components/Avatar'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { EmptyState } from '@/shared/components/EmptyState'
import { useToast } from '@/shared/components/Toast'
import { Building2 } from 'lucide-react'

export default function DepartmentListPage() {
  const { toast } = useToast()
  const { data, isLoading } = useDepartments()
  const { data: empData } = useEmployees({ limit: 100 })
  const createDept = useCreateDepartment()
  const updateDept = useUpdateDepartment()
  const deleteDept = useDeleteDepartment()

  const departments = data?.data ?? []
  const employees = empData?.data ?? []

  const [modalOpen, setModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<any>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [headId, setHeadId] = useState('')

  const openCreate = () => { setEditingDept(null); setName(''); setHeadId(''); setModalOpen(true) }
  const openEdit = (dept: any) => { setEditingDept(dept); setName(dept.name); setHeadId(dept.headId ?? ''); setModalOpen(true) }

  const handleSave = async () => {
    try {
      if (editingDept) {
        await updateDept.mutateAsync({ id: editingDept.id, name, headId: headId || undefined })
        toast({ message: 'Department updated', variant: 'success' })
      } else {
        await createDept.mutateAsync({ name, headId: headId || undefined })
        toast({ message: 'Department created', variant: 'success' })
      }
      setModalOpen(false)
    } catch {
      toast({ message: 'Something went wrong', variant: 'error' })
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    await deleteDept.mutateAsync(deletingId)
    toast({ message: 'Department deleted', variant: 'success' })
    setDeletingId(null)
  }

  const columns = [
    { key: 'name', header: 'Name', render: (r: any) => <span className="font-medium">{r.name}</span> },
    {
      key: 'head',
      header: 'Head',
      render: (r: any) => r.head ? (
        <div className="flex items-center gap-2">
          <Avatar name={`${r.head.firstName} ${r.head.lastName}`} size="sm" />
          <span className="text-sm">{r.head.firstName} {r.head.lastName}</span>
        </div>
      ) : '—',
    },
    { key: 'employeeCount', header: 'Employees', render: (r: any) => r.employeeCount ?? 0 },
    {
      key: 'actions',
      header: '',
      render: (r: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => setDeletingId(r.id)}>Delete</Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Departments"
        actions={<Button size="sm" onClick={openCreate}>+ Add Department</Button>}
      />
      <Table
        columns={columns}
        data={departments}
        isLoading={isLoading}
        emptyState={<EmptyState icon={Building2} title="No departments found" />}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDept ? 'Edit Department' : 'Add Department'}
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={createDept.isPending || updateDept.isPending}>Save</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Department Name" value={name} onChange={e => setName(e.target.value)} required />
          <Select
            label="Head of Department"
            value={headId}
            onChange={e => setHeadId(e.target.value)}
            options={[{ value: '', label: 'None' }, ...employees.map((e: any) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` }))]}
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Department"
        message="This will remove the department. Employees will not be deleted."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
