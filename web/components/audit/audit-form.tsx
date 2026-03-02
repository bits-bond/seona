'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@heroui/react';

interface Project {
  id: string;
  name: string;
  url: string;
}

interface AuditFormProps {
  projectId?: string;
  projects: Project[];
  onSubmit: (data: { projectId: string; url: string; projectName?: string }) => void;
  isSubmitting: boolean;
}

const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

const inputClass =
  "h-10 w-full rounded-lg border-2 border-default-200 bg-transparent px-3 text-sm text-foreground outline-none transition-colors hover:border-default-400 focus:border-primary";

export function AuditForm({ projectId, projects, onSubmit, isSubmitting }: AuditFormProps) {
  const [selectedProjectId, setSelectedProjectId] = useState(projectId ?? '');
  const [isNewProject, setIsNewProject] = useState(projects.length === 0);
  const [url, setUrl] = useState('');
  const [projectName, setProjectName] = useState('');
  const [urlError, setUrlError] = useState('');

  const handleProjectChange = (value: string) => {
    setSelectedProjectId(value);
    const project = projects.find((p) => p.id === value);
    if (project) {
      setUrl(project.url);
      setUrlError('');
    }
  };

  const validateUrl = (value: string): boolean => {
    if (!value.trim()) {
      setUrlError('URL is required');
      return false;
    }
    if (!URL_REGEX.test(value)) {
      setUrlError('Enter a valid URL (e.g., https://example.com)');
      return false;
    }
    setUrlError('');
    return true;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!validateUrl(url)) return;

    if (isNewProject) {
      if (!projectName.trim()) return;
      onSubmit({ projectId: '', url, projectName: projectName.trim() });
    } else {
      if (!selectedProjectId) return;
      onSubmit({ projectId: selectedProjectId, url });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-lg">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isNewProject}
          onChange={(e) => {
            const val = e.target.checked;
            setIsNewProject(val);
            if (val) {
              setSelectedProjectId('');
              setUrl('');
            }
          }}
          className="h-4 w-4 rounded border-default-300 accent-primary"
        />
        <span className="text-sm font-medium">Create new project</span>
      </label>

      {isNewProject ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="project-name" className="text-sm font-medium text-foreground">
            Project Name <span className="text-danger">*</span>
          </label>
          <input
            id="project-name"
            placeholder="My Website"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
            className={inputClass}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="project-select" className="text-sm font-medium text-foreground">
            Select Project <span className="text-danger">*</span>
          </label>
          <select
            id="project-select"
            value={selectedProjectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            required
            className={inputClass}
          >
            <option value="" disabled>Choose a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="url-input" className="text-sm font-medium text-foreground">
          Website URL <span className="text-danger">*</span>
        </label>
        <input
          id="url-input"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (urlError) validateUrl(e.target.value);
          }}
          required
          type="url"
          className={`${inputClass} ${urlError ? 'border-danger' : ''}`}
        />
        {urlError && (
          <p className="text-xs text-danger">{urlError}</p>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isDisabled={isSubmitting || (!isNewProject && !selectedProjectId) || !url}
      >
        {isSubmitting ? 'Starting Audit...' : 'Start Audit'}
      </Button>
    </form>
  );
}
