"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/auth";

const statuses = [
  "IDEA",
  "PLANNING",
  "BUILDING",
  "TESTING",
  "DEPLOYING",
  "LIVE",
  "PAUSED",
  "ARCHIVED",
] as const;

const appSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  proposedDomain: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().url().optional()
  ),
  githubUrl: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().url().optional()
  ),
  status: z.enum(statuses).default("PLANNING"),
});

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

async function uniqueSlug(base: string) {
  let slug = base;
  let i = 1;
  // ensure uniqueness across all apps
  while (await prisma.app.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

export async function createApp(input: unknown) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email as string | undefined;
  if (!email) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Unauthorized");
  const data = appSchema.parse(input);
  const baseSlug = slugify(data.name);
  const slug = await uniqueSlug(baseSlug || "app");
  const app = await prisma.app.create({
    data: {
      name: data.name,
      description: data.description ?? undefined,
      proposedDomain: data.proposedDomain,
      githubUrl: data.githubUrl,
      status: data.status,
      slug,
      ownerId: user.id,
    },
  });
  revalidatePath("/");
  revalidatePath(`/apps/${app.slug}`);
  return app;
}

export async function listApps() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email as string | undefined;
  if (!email) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Unauthorized");
  return prisma.app.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
  });
}

export async function updateApp(id: string, input: unknown) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email as string | undefined;
  if (!email) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Unauthorized");
  const data = appSchema.partial().parse(input);
  const app = await prisma.app.findUnique({ where: { id } });
  if (!app || app.ownerId !== user.id)
    throw new Error("Not found");

  let slug: string | undefined;
  if (data.name && data.name !== app.name) {
    slug = await uniqueSlug(slugify(data.name));
  }

  const updated = await prisma.app.update({
    where: { id },
    data: { ...data, slug },
  });
  revalidatePath("/");
  revalidatePath(`/apps/${updated.slug}`);
  return updated;
}

export async function deleteApp(id: string) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email as string | undefined;
  if (!email) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Unauthorized");
  const app = await prisma.app.findUnique({ where: { id } });
  if (!app || app.ownerId !== user.id)
    throw new Error("Not found");
  await prisma.app.delete({ where: { id } });
  revalidatePath("/");
}
