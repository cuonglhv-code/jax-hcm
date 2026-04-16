import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Clock, Building2, ExternalLink } from 'lucide-react';
import api from '../../../services/api';
import { Badge, statusVariant } from '../../../components/Badge';
import { Button } from '../../../components/Button';

const TYPE_COLORS: Record<string, string> = {
  internal: 'from-brand-500 to-brand-700',
  external: 'from-violet-500 to-purple-700',
  online: 'from-cyan-500 to-blue-700',
  certification: 'from-amber-500 to-orange-600',
};

export function CourseCataloguePage() {
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['courses', typeFilter, search],
    queryFn: () => api.get('/learning/courses', {
      params: { type: typeFilter || undefined, search: search || undefined, limit: 50 }
    }).then(r => r.data.data),
  });

  const courses = data ?? [];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Learning Catalogue</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{courses.length} courses available</p>
        </div>
        <Button size="sm">New Course</Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <input
          type="search"
          placeholder="Search courses…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 w-56"
        />
        {['', 'internal', 'external', 'online', 'certification'].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === t
                ? 'bg-brand-600 text-white'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            {t || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-52 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((course: Record<string, string | boolean | number>) => (
            <div key={course.id as string} className="glass-card p-5 hover:shadow-card-hover transition-shadow flex flex-col">
              <div className={`h-2 rounded-full bg-gradient-to-r ${TYPE_COLORS[course.type as string] ?? 'from-gray-400 to-gray-500'} mb-4`} />
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-snug">
                  {course.title as string}
                </h3>
                <BookOpen className="size-5 text-gray-300 shrink-0 mt-0.5" />
              </div>
              {course.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{course.description as string}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {course.duration_hours}h
                </span>
                {course.provider && (
                  <span className="flex items-center gap-1">
                    <Building2 className="size-3.5" />
                    {course.provider as string}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <Badge variant={course.is_mandatory ? 'rejected' : 'default'}>
                  {course.is_mandatory ? 'Mandatory' : 'Optional'}
                </Badge>
                <Badge variant="info">{course.type as string}</Badge>
                <div className="flex-1" />
                <Button variant="secondary" size="xs">Enrol</Button>
              </div>
            </div>
          ))}
          {!courses.length && (
            <div className="col-span-3 text-center text-gray-400 py-16">No courses found</div>
          )}
        </div>
      )}
    </div>
  );
}
