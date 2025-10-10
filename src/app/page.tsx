"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import prisma from "@/lib/prisma";
import { createApp } from "@/actions/apps";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apps, setApps] = useState([]);
  const [loginError, setLoginError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [appForm, setAppForm] = useState({
    name: "",
    description: "",
    proposedDomain: "",
    githubUrl: "",
    status: "PLANNING"
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
      if (data.authenticated) {
        fetchApps();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApps = async () => {
    try {
      const response = await fetch('/api/apps');
      const data = await response.json();
      setApps(data);
    } catch (error) {
      console.error('Failed to fetch apps:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        await fetchApps();
      } else {
        setLoginError(data.error || 'Login failed');
      }
    } catch (error) {
      setLoginError('Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setApps([]);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleAddApp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/apps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appForm),
      });

      if (response.ok) {
        setAppForm({
          name: "",
          description: "",
          proposedDomain: "",
          githubUrl: "",
          status: "PLANNING"
        });
        await fetchApps();
      }
    } catch (error) {
      console.error('Failed to add app:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-5xl p-6 space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show sign-in UI
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto max-w-5xl p-6 space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">AppTracker</h1>
        </header>

        <main className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4 w-full max-w-md">
            <h2 className="text-xl font-medium">Welcome to AppTracker</h2>
            <p className="text-gray-600">Please sign in to manage your applications</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              {loginError && (
                <div className="text-red-600 text-sm">{loginError}</div>
              )}
              <button
                type="submit"
                className="w-full px-6 py-3 rounded bg-gray-900 text-white hover:bg-gray-800"
              >
                Sign In
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl p-6 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">AppTracker</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:underline"
        >
          Sign out
        </button>
      </header>

      <section className="rounded-lg border p-4">
        <h2 className="font-medium mb-3">Create new application</h2>
        <form onSubmit={handleAddApp} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            name="name"
            placeholder="Name"
            value={appForm.name}
            onChange={(e) => setAppForm({ ...appForm, name: e.target.value })}
            required
            className="border rounded p-2"
          />
          <select
            name="status"
            value={appForm.status}
            onChange={(e) => setAppForm({ ...appForm, status: e.target.value })}
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
            name="proposedDomain"
            placeholder="Proposed domain (https://...)"
            value={appForm.proposedDomain}
            onChange={(e) => setAppForm({ ...appForm, proposedDomain: e.target.value })}
            className="border rounded p-2 col-span-1 md:col-span-2"
          />
          <input
            name="githubUrl"
            placeholder="GitHub URL (https://github.com/...)"
            value={appForm.githubUrl}
            onChange={(e) => setAppForm({ ...appForm, githubUrl: e.target.value })}
            className="border rounded p-2 col-span-1 md:col-span-2"
          />
          <textarea
            name="description"
            placeholder="Description"
            value={appForm.description}
            onChange={(e) => setAppForm({ ...appForm, description: e.target.value })}
            className="border rounded p-2 col-span-1 md:col-span-2"
          />
          <div className="col-span-1 md:col-span-2 flex justify-end">
            <button type="submit" className="px-4 py-2 rounded bg-black text-white">
              Add
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="font-medium mb-3">Your apps</h2>
        {apps.length === 0 ? (
          <p className="text-sm text-gray-600">No apps yet.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {apps.map((app) => (
              <li key={app.id} className="border rounded p-4">
                <div className="flex items-center justify-between">
                  <Link href={`/apps/${app.slug}`} className="font-medium hover:underline">
                    {app.name}
                  </Link>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100">{app.status}</span>
                </div>
                {app.proposedDomain && (
                  <div className="text-xs text-gray-600 mt-1">{app.proposedDomain}</div>
                )}
                {app.githubUrl && (
                  <a href={app.githubUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                    GitHub
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
