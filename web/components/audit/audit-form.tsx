'use client';

import { useState, type FormEvent } from 'react';
import { Button, Input, Select, SelectItem, Switch } from '@heroui/react';

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

export function AuditForm({ projectId, projects, onSubmit, isSubmitting }: AuditFormProps) {
  const [selectedProjectId, setSelectedProjectId] = useState(projectId ?? '');
  const [isNewProject, setIsNewProject] = useState(projects.length === 0);
  const [url, setUrl] = useState('');
  const [projectName, setProjectName] = useState('');
  const [urlError, setUrlError] = useState('');

  // Auto-fill URL when project is selected
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
      <div className="flex items-center gap-2">
        <Switch
          isSelected={isNewProject}
          onValueChange={(val) => {
            setIsNewProject(val);
            if (val) {
              setSelectedProjectId('');
              setUrl('');
            }
          }}
          size="sm"
        >
          Create new project
        </Switch>
      </div>

      {isNewProject ? (
        <Input
          label="Project Name"
          placeholder="My Website"
          value={projectName}
          onValueChange={setProjectName}
          isRequired
          variant="bordered"
        />
      ) : (
        <Select
          label="Select Project"
          placeholder="Choose a project"
          selectedKeys={selectedProjectId ? [selectedProjectId] : []}
          onSelectionChange={(keys) => {
            const key = Array.from(keys)[0] as string;
            if (key) handleProjectChange(key);
          }}
          isRequired
          variant="bordered"
        >
          {projects.map((project) => (
            <SelectItem key={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </Select>
      )}

      <Input
        label="Website URL"
        placeholder="https://example.com"
        value={url}
        onValueChange={(val) => {
          setUrl(val);
          if (urlError) validateUrl(val);
        }}
        isRequired
        isInvalid={!!urlError}
        errorMessage={urlError}
        variant="bordered"
        type="url"
      />

      <Button
        type="submit"
        color="primary"
        size="lg"
        isLoading={isSubmitting}
        isDisabled={isSubmitting || (!isNewProject && !selectedProjectId) || !url}
      >
        {isSubmitting ? 'Starting Audit...' : 'Start Audit'}
      </Button>
    </form>
  );
}
