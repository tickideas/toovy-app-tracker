"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";

export default function AppDetail({ params }: { params: { slug: string } }) {
  const [app, setApp] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    proposedDomain: "",
    githubUrl: "",
    status: "PLANNING"
  });

  useEffect(() => {
    fetchApp();
  }, [params.slug]);

  const fetchApp = async () => {
    try {
      const response = await fetch(`/api/apps/${params.slug}`);
      if (response.ok) {
        const data = await response.json();
        setApp(data);
        setEditForm({
          name: data.name,
          description: data.description || "",
          proposedDomain: data.proposedDomain || "",
          githubUrl: data.githubUrl || "",
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
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/apps/${params.slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const updatedApp = await response.json();
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
            onClick={() => setIsEditing(!isEditing)}
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
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
              className="border rounded p-2"
            />
            <select
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              className="border rounded p-2"
            >
              <option value="IDEA">Idea</option>
              <option value="PLANNING">Planning</option>
              <option value="BUILDING">Building</option>
              <option value="TESTING">Testing</option>
              <option value="DEPLOYING">Deploying</option>
              <option value="LIVE">Live</option>
              <option value="PAUSED">Paused</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <input
              type="text"
              placeholder="Proposed domain (https://...)"
              value={editForm.proposedDomain}
              onChange={(e) => setEditForm({ ...editForm, proposedDomain: e.target.value })}
              className="border rounded p-2 col-span-1 md:col-span-2"
            />
            <input
              type="text"
              placeholder="GitHub URL (https://github.com/...)"
              value={editForm.githubUrl}
              onChange={(e) => setEditForm({ ...editForm, githubUrl: e.target.value })}
              className="border rounded p-2 col-span-1 md:col-span-2"
            />
            <textarea
              placeholder="Description"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
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
              <button
                type="submit"
                className="px-4 py-2 rounded bg-black text-white"
              >
                Save Changes
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="grid gap-2">
          {app.proposedDomain && (
            <div className="text-sm">Domain: {app.proposedDomain}</div>
          )}
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
          {app.description && (
            <p className="text-sm text-gray-700">{app.description}</p>
          )}
        </section>
      )}

      <section className="rounded border p-4 bg-gray-50">
        <p className="text-sm text-gray-600">
          Updates functionality coming soon! For now, you can edit your app details using the Edit button above.
        </p>
      </section>
    </div>
  );
}
