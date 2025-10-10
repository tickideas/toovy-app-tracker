'use client';

import {
  useState,
  useEffect,
  useCallback,
  type FormEvent,
  type ChangeEvent,
  type ChangeEventHandler
} from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { AppStatus } from '@prisma/client';

interface AppDetails {
  id: string;
  name: string;
  description: string | null;
  proposedDomain: string | null;
  githubUrl: string | null;
  status: AppStatus;
}

interface AppFormState {
  name: string;
  description: string;
  proposedDomain: string;
  githubUrl: string;
  status: AppStatus;
}

const statusOptions: AppStatus[] = [
  'IDEA',
  'PLANNING',
  'BUILDING',
  'TESTING',
  'DEPLOYING',
  'LIVE',
  'PAUSED',
  'ARCHIVED'
];

export default function AppDetail({ params }: { params: { slug: string } }) {
  const [app, setApp] = useState<AppDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<AppFormState>({
    name: '',
    description: '',
    proposedDomain: '',
    githubUrl: '',
    status: 'PLANNING'
  });

  const fetchApp = useCallback(async () => {
    try {
      const response = await fetch(`/api/apps/${params.slug}`);

      if (response.ok) {
        const data: AppDetails = await response.json();
        setApp(data);
        setEditForm({
          name: data.name,
          description: data.description ?? '',
          proposedDomain: data.proposedDomain ?? '',
          githubUrl: data.githubUrl ?? '',
          status: data.status
        });
      } else if (response.status === 404) {
        notFound();
      }
    } catch (error) {
      console.error('Failed to fetch app:', error);
    } finally {
      setIsLoading(false);
    }
  }, [params.slug]);

  useEffect(() => {
    fetchApp();
  }, [fetchApp]);

  const handleFormChange =
    <T extends HTMLInputElement | HTMLTextAreaElement>(
      key: keyof AppFormState,
      formatter?: (value: string) => string
    ): ChangeEventHandler<T> =>
    (event: ChangeEvent<T>) => {
      const value = formatter ? formatter(event.target.value) : event.target.value;
      setEditForm((current) => ({ ...current, [key]: value }));
    };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response = await fetch(`/api/apps/${params.slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const updatedApp: AppDetails = await response.json();
        setApp(updatedApp);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update app:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (!app) {
    return notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{app.name}</h1>
          <div className="text-sm text-gray-600">Status: {app.status}</div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsEditing((current) => !current)}
            className="text-sm bg-gray-900 text-white px-3 py-1 rounded hover:bg-gray-800"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
          <Link href="/" className="text-sm hover:underline">
            Back
          </Link>
        </div>
      </header>

      {isEditing ? (
        <section className="rounded-lg border p-4">
          <h2 className="font-medium mb-3">Edit Application</h2>
          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Name"
              value={editForm.name}
              onChange={handleFormChange('name')}
              required
              className="border rounded p-2"
            />
            <select
              value={editForm.status}
              onChange={handleFormChange('status', (value) => value as AppStatus)}
              className="border rounded p-2"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option[0] + option.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Proposed domain (https://...)"
              value={editForm.proposedDomain}
              onChange={handleFormChange('proposedDomain')}
              className="border rounded p-2 col-span-1 md:col-span-2"
            />
            <input
              type="text"
              placeholder="GitHub URL (https://github.com/...)"
              value={editForm.githubUrl}
              onChange={handleFormChange('githubUrl')}
              className="border rounded p-2 col-span-1 md:col-span-2"
            />
            <textarea
              placeholder="Description"
              value={editForm.description}
              onChange={handleFormChange('description')}
              className="border rounded p-2 col-span-1 md:col-span-2"
              rows={3}
            />
            <div className="col-span-1 md:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded bg-black text-white">
                Save Changes
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="grid gap-2">
          {app.proposedDomain && <div className="text-sm">Domain: {app.proposedDomain}</div>}
          {app.githubUrl && (
            <a
              href={app.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              GitHub repo
            </a>
          )}
          {app.description && <p className="text-sm text-gray-700">{app.description}</p>}
        </section>
      )}

      <section className="rounded border p-4 bg-gray-50">
        <p className="text-sm text-gray-600">
          Updates functionality coming soon! For now, you can edit your app details using the Edit
          button above.
        </p>
      </section>
    </div>
  );
}
