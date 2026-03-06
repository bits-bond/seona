"use client";

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { AppShell } from '@/components/layout';
import { LoadingSkeleton } from '@/components/ui';
import { Play, Plus, RefreshCw, Globe, FolderOpen } from 'lucide-react';
import type { Project } from '@/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function NewAuditForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProjectId = searchParams.get('projectId');

  const { data: projects, isLoading, error, mutate } = useSWR<Project[]>('/api/projects', fetcher);

  const [selectedProjectId, setSelectedProjectId] = useState<string>(preselectedProjectId ?? '');
  const [isNewProject, setIsNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Pre-fill URL when selecting an existing project
  useEffect(() => {
    if (selectedProjectId && projects) {
      const project = projects.find((p) => p.id === selectedProjectId);
      if (project) {
        setUrl(project.url);
      }
    }
  }, [selectedProjectId, projects]);

  // Pre-select project from URL param
  useEffect(() => {
    if (preselectedProjectId) {
      setSelectedProjectId(preselectedProjectId);
      setIsNewProject(false);
    }
  }, [preselectedProjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      let projectId = selectedProjectId;

      // Create new project if needed
      if (isNewProject) {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newProjectName, url }),
        });
        if (!res.ok) {
          throw new Error('Failed to create project');
        }
        const newProject = await res.json();
        projectId = newProject.id;
      }

      // Create the audit
      const res = await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, url }),
      });

      if (!res.ok) {
        throw new Error('Failed to create audit');
      }

      const audit = await res.json();

      // Trigger the actual audit run
      await fetch(`/api/audits/${audit.id}/run`, { method: 'POST' });

      router.push(`/projects/${projectId}/audits/${audit.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = isNewProject
    ? newProjectName.trim() !== '' && url.trim() !== ''
    : selectedProjectId !== '' && url.trim() !== '';

  if (isLoading) {
    return <LoadingSkeleton variant="card" />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-danger text-sm">Failed to load projects.</p>
        <button
          onClick={() => mutate()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-default-100 hover:bg-default-200 text-sm font-medium transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Selection */}
        <div className="p-6 rounded-xl bg-content1 border border-divider space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-default-500" />
              Project
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsNewProject(!isNewProject);
                setSelectedProjectId('');
                setUrl('');
                setNewProjectName('');
              }}
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              {isNewProject ? 'Select Existing' : 'Create New'}
            </button>
          </div>

          {isNewProject ? (
            <div className="space-y-3">
              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-foreground mb-1.5">
                  Project Name
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="My Website"
                  className="w-full px-3 py-2 rounded-lg border border-divider bg-content2 text-sm text-foreground placeholder:text-default-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="project" className="block text-sm font-medium text-foreground mb-1.5">
                Select Project
              </label>
              <select
                id="project"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-divider bg-content2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Choose a project...</option>
                {projects?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.url.replace(/^https?:\/\//, '')})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* URL Input */}
        <div className="p-6 rounded-xl bg-content1 border border-divider">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-default-500" />
            Website URL
          </h3>
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-foreground mb-1.5">
              URL to Audit
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              readOnly={!isNewProject && selectedProjectId !== ''}
              className={`w-full px-3 py-2 rounded-lg border border-divider text-sm text-foreground placeholder:text-default-400 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                !isNewProject && selectedProjectId !== ''
                  ? 'bg-default-100 cursor-not-allowed'
                  : 'bg-content2'
              }`}
            />
            {!isNewProject && selectedProjectId !== '' && (
              <p className="text-xs text-default-400 mt-1.5">
                URL is pre-filled from the selected project.
              </p>
            )}
          </div>
        </div>

        {/* Error message */}
        {submitError && (
          <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">
            {submitError}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!isValid || submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Starting Audit...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Start Audit
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function NewAuditPage() {
  return (
    <AppShell
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'New Audit' },
      ]}
      pageTitle="New Audit"
      pageDescription="Run a new SEO audit on a website"
    >
      <Suspense fallback={<LoadingSkeleton variant="card" />}>
        <NewAuditForm />
      </Suspense>
    </AppShell>
  );
}
