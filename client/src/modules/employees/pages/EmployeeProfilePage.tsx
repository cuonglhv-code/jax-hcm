import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, Building2 } from 'lucide-react';
import api from '../../../services/api';
import { Button } from '../../../components/Button';
import { Badge, statusVariant } from '../../../components/Badge';
import { Avatar } from '../../../components/Avatar';

export function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => api.get(`/employees/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: docs } = useQuery({
    queryKey: ['employee-docs', id],
    queryFn: () => api.get(`/employees/${id}/documents`).then((r) => r.data.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="space-y-4">
          <div className="skeleton h-8 w-48 rounded" />
          <div className="glass-card p-8 space-y-4">
            <div className="flex items-center gap-4">
              <div className="skeleton size-20 rounded-full" />
              <div className="space-y-2">
                <div className="skeleton h-6 w-48 rounded" />
                <div className="skeleton h-4 w-32 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const emp = data;
  const fullName = `${emp.first_name} ${emp.last_name}`;

  return (
    <div className="page-container">
      {/* Back */}
      <button
        onClick={() => navigate('/employees')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Employees
      </button>

      {/* Profile card */}
      <div className="glass-card p-8 mb-6">
        <div className="flex items-start gap-6">
          <Avatar name={fullName} src={emp.avatar_url} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{fullName}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-0.5">{emp.job_title}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">{emp.employee_number}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={statusVariant(emp.status)} dot>{emp.status}</Badge>
                <Button variant="outline" size="sm">Edit Profile</Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <InfoItem icon={Building2} label="Department" value={emp.department_name} />
              <InfoItem icon={Briefcase} label="Employment" value={emp.employment_type?.replace('_', ' ')} />
              <InfoItem icon={Calendar} label="Start Date" value={new Date(emp.start_date).toLocaleDateString('en-GB')} />
              <InfoItem icon={Mail} label="Email" value={emp.email} />
              {emp.phone && <InfoItem icon={Phone} label="Phone" value={emp.phone} />}
              {emp.address && <InfoItem icon={MapPin} label="Address" value={emp.address} />}
              {emp.manager_name && <InfoItem icon={null} label="Manager" value={emp.manager_name} />}
            </div>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Documents ({docs?.length ?? 0})
          </h2>
          <Button variant="outline" size="sm">Upload Document</Button>
        </div>
        {!docs?.length ? (
          <p className="text-sm text-gray-400 py-4 text-center">No documents uploaded yet</p>
        ) : (
          <div className="space-y-2">
            {docs.map((doc: { id: string; name: string; document_type: string; file_size: number; created_at: string }) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-surface-dark-border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div>
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{doc.name}</div>
                  <div className="text-xs text-gray-400">
                    {doc.document_type} · {(doc.file_size / 1024).toFixed(1)} KB ·{' '}
                    {new Date(doc.created_at).toLocaleDateString('en-GB')}
                  </div>
                </div>
                <Button variant="ghost" size="xs">Download</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType | null; label: string; value?: string }) {
  return (
    <div className="flex items-start gap-2.5">
      {Icon && <Icon className="size-4 text-gray-400 mt-0.5 shrink-0" />}
      <div>
        <div className="text-xs text-gray-400 uppercase tracking-wider">{label}</div>
        <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5">{value || '—'}</div>
      </div>
    </div>
  );
}
