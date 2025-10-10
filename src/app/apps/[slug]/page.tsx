import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createUpdate } from "@/actions/updates";
import { authOptions } from "@/auth";

export default async function AppDetail({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email as string | undefined;
  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  const userId = user?.id as string;
  const app = await prisma.app.findFirst({
    where: { slug: params.slug, ownerId: userId },
    include: {
      updates: { orderBy: { date: "desc" } },
      deployments: { orderBy: { deployedAt: "desc" } },
    },
  });
  if (!app) notFound();
  const appId = app.id;

  async function addUpdate(formData: FormData) {
    "use server";
    const tagsRaw = String(formData.get("tags") || "");
    await createUpdate({
      appId,
      date: formData.get("date") ? new Date(String(formData.get("date"))) : undefined,
      period: String(formData.get("period") || "WEEK"),
      progress: Number(formData.get("progress") || 0),
      summary: String(formData.get("summary") || "").trim(),
      blockers: String(formData.get("blockers") || "").trim() || undefined,
      tags: tagsRaw
        ? tagsRaw
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    });
  }

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{app.name}</h1>
          <div className="text-sm text-gray-600">Status: {app.status}</div>
        </div>
        <Link href="/" className="text-sm hover:underline">
          Back
        </Link>
      </header>

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

      <section className="rounded border p-4">
        <h2 className="font-medium mb-3">Add update</h2>
        <form action={addUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input type="date" name="date" className="border rounded p-2" />
          <select name="period" defaultValue="WEEK" className="border rounded p-2">
            <option value="DAY">Day</option>
            <option value="WEEK">Week</option>
            <option value="MONTH">Month</option>
          </select>
          <input
            type="number"
            min={0}
            max={100}
            name="progress"
            placeholder="Progress %"
            className="border rounded p-2"
          />
          <input name="tags" placeholder="tags (comma separated)" className="border rounded p-2" />
          <textarea
            name="summary"
            required
            placeholder="What changed?"
            className="border rounded p-2 md:col-span-2"
          />
          <textarea
            name="blockers"
            placeholder="Any blockers?"
            className="border rounded p-2 md:col-span-2"
          />
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="px-4 py-2 rounded bg-black text-white">
              Save update
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Timeline</h2>
        {app.updates.length === 0 ? (
          <p className="text-sm text-gray-600">No updates yet.</p>
        ) : (
          <ul className="space-y-2">
            {app.updates.map((u) => (
              <li key={u.id} className="border rounded p-3">
                <div className="text-xs text-gray-500">
                  {new Date(u.date).toLocaleDateString()} • {u.period} • {u.progress}%
                </div>
                <div className="text-sm">{u.summary}</div>
                {u.blockers && (
                  <div className="text-xs text-red-600">Blockers: {u.blockers}</div>
                )}
                {(() => {
                  const tags = Array.isArray(u.tags) && (u.tags as unknown[]).every((x) => typeof x === "string")
                    ? (u.tags as string[])
                    : [];
                  return tags.length > 0 ? (
                    <div className="mt-1 flex gap-2 flex-wrap">
                      {tags.map((t, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 bg-gray-100 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null;
                })()}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
