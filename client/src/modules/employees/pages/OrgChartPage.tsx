import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../../services/api';
import { Avatar } from '../../../components/Avatar';

interface OrgNode {
  id: string;
  first_name: string;
  last_name: string;
  manager_id?: string;
  department_name: string;
  job_title: string;
  avatar_url?: string;
  children?: OrgNode[];
}

function buildTree(employees: OrgNode[]): OrgNode[] {
  const map = new Map<string, OrgNode>();
  employees.forEach((e) => map.set(e.id, { ...e, children: [] }));

  const roots: OrgNode[] = [];
  map.forEach((emp) => {
    if (emp.manager_id && map.has(emp.manager_id)) {
      map.get(emp.manager_id)!.children!.push(emp);
    } else {
      roots.push(emp);
    }
  });
  return roots;
}

function OrgNode({ node, navigate }: { node: OrgNode; navigate: (path: string) => void }) {
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={() => navigate(`/employees/${node.id}`)}
        className="glass-card p-3 hover:shadow-card-hover transition-shadow w-44 text-center group"
      >
        <Avatar name={`${node.first_name} ${node.last_name}`} size="md" className="mx-auto mb-2" />
        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-brand-600">
          {node.first_name} {node.last_name}
        </div>
        <div className="text-xs text-gray-400 truncate">{node.job_title}</div>
        <div className="text-xs text-brand-500 mt-0.5">{node.department_name}</div>
      </button>

      {node.children && node.children.length > 0 && (
        <div className="relative flex flex-col items-center">
          {/* Vertical line down */}
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
          {/* Horizontal line */}
          {node.children.length > 1 && (
            <div className="h-px bg-gray-200 dark:bg-gray-700"
              style={{ width: `${node.children.length * 184 + (node.children.length - 1) * 16}px` }}
            />
          )}
          <div className="flex gap-4 mt-0">
            {node.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
                <OrgNode node={child} navigate={navigate} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function OrgChartPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['org-chart'],
    queryFn: () => api.get('/employees/org-chart').then((r) => r.data.data),
  });

  const tree = data ? buildTree(data) : [];

  return (
    <div className="page-container">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/employees')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          <ArrowLeft className="size-4" />
          Employees
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Organisation Chart</h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="size-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="glass-card p-8 overflow-auto">
          <div className="flex justify-center min-w-max">
            <div className="flex gap-8">
              {tree.map((root) => (
                <OrgNode key={root.id} node={root} navigate={navigate} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
