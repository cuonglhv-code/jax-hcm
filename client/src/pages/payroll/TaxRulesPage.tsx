import React, { useState } from 'react'
import { useTaxRules, useCreateTaxRule, useUpdateTaxRule, useDeleteTaxRule } from '@/hooks/usePayroll'
import { PageHeader } from '@/shared/components/PageHeader'
import { Table } from '@/shared/components/Table'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { Input } from '@/shared/components/Input'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { EmptyState } from '@/shared/components/EmptyState'
import { useToast } from '@/shared/components/Toast'
import { Percent } from 'lucide-react'

const emptyForm = { name: '', jurisdiction: '', minIncome: '', maxIncome: '', rate: '', isActive: true }

export default function TaxRulesPage() {
  const { toast } = useToast()
  const { data, isLoading } = useTaxRules()
  const createRule = useCreateTaxRule()
  const updateRule = useUpdateTaxRule()
  const deleteRule = useDeleteTaxRule()

  const taxRules = data?.data ?? []

  const [modalOpen, setModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<any>(null)
  const [form, setForm] = useState(emptyForm)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const openCreate = () => { setEditingRule(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (rule: any) => {
    setEditingRule(rule)
    setForm({ name: rule.name, jurisdiction: rule.jurisdiction, minIncome: rule.minIncome ?? '', maxIncome: rule.maxIncome ?? '', rate: String(Number(rule.rate) * 100), isActive: rule.isActive })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const payload = { ...form, rate: parseFloat(form.rate) / 100, minIncome: form.minIncome ? parseFloat(form.minIncome) : undefined, maxIncome: form.maxIncome ? parseFloat(form.maxIncome) : undefined }
    try {
      if (editingRule) {
        await updateRule.mutateAsync({ id: editingRule.id, ...payload })
        toast({ message: 'Tax rule updated', variant: 'success' })
      } else {
        await createRule.mutateAsync(payload)
        toast({ message: 'Tax rule created', variant: 'success' })
      }
      setModalOpen(false)
    } catch { toast({ message: 'Failed to save', variant: 'error' }) }
  }

  const columns = [
    { key: 'name', header: 'Name', render: (r: any) => <span className="font-medium">{r.name}</span> },
    { key: 'jurisdiction', header: 'Jurisdiction' },
    { key: 'minIncome', header: 'Min Income', render: (r: any) => r.minIncome ? `$${Number(r.minIncome).toLocaleString()}` : '—' },
    { key: 'maxIncome', header: 'Max Income', render: (r: any) => r.maxIncome ? `$${Number(r.maxIncome).toLocaleString()}` : '—' },
    { key: 'rate', header: 'Rate', render: (r: any) => `${(Number(r.rate) * 100).toFixed(1)}%` },
    { key: 'isActive', header: 'Status', render: (r: any) => r.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="neutral">Inactive</Badge> },
    {
      key: 'actions', header: '',
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
      <PageHeader title="Tax Rules" actions={<Button size="sm" onClick={openCreate}>+ Add Tax Rule</Button>} />
      <Table columns={columns} data={taxRules} isLoading={isLoading} emptyState={<EmptyState icon={Percent} title="No tax rules defined" />} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRule ? 'Edit Tax Rule' : 'Add Tax Rule'}
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={createRule.isPending || updateRule.isPending}>Save</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Input label="Jurisdiction" value={form.jurisdiction} onChange={e => setForm(f => ({ ...f, jurisdiction: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Min Income ($)" type="number" value={String(form.minIncome)} onChange={e => setForm(f => ({ ...f, minIncome: e.target.value }))} />
            <Input label="Max Income ($)" type="number" value={String(form.maxIncome)} onChange={e => setForm(f => ({ ...f, maxIncome: e.target.value }))} />
          </div>
          <Input label="Rate (%)" type="number" min="0" max="100" step="0.1" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} required />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-primary" />
            Active
          </label>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={async () => { await deleteRule.mutateAsync(deletingId!); setDeletingId(null) }} title="Delete Tax Rule" message="This will permanently remove this tax rule." confirmLabel="Delete" variant="danger" />
    </div>
  )
}
