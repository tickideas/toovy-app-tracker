"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/auth";

const periods = ["DAY", "WEEK", "MONTH"] as const;

const updateSchema = z.object({
  appId: z.string().min(1),
  date: z.coerce.date().optional(),
  period: z.enum(periods),
  progress: z.number().int().min(0).max(100).default(0),
  summary: z.string().min(1),
  blockers: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export async function createUpdate(input: unknown) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email as string | undefined;
  if (!email) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Unauthorized");
  const data = updateSchema.parse(input);

  const app = await prisma.app.findUnique({ where: { id: data.appId } });
  if (!app || app.ownerId !== user.id)
    throw new Error("App not found");

  const update = await prisma.update.create({
    data: {
      appId: data.appId,
      authorId: user.id,
      date: data.date ?? new Date(),
      period: data.period,
      progress: data.progress ?? 0,
      summary: data.summary,
      blockers: data.blockers ?? undefined,
      tags: data.tags ?? [],
    },
    include: { app: true },
  });

  // touch app updatedAt
  await prisma.app.update({ where: { id: data.appId }, data: {} });

  revalidatePath("/");
  revalidatePath(`/apps/${update.app.slug}`);
  return update;
}

export async function listUpdates(params?: {
  appId?: string;
  period?: (typeof periods)[number];
  from?: Date | string;
  to?: Date | string;
}) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email as string | undefined;
  if (!email) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Unauthorized");
  const { appId, period, from, to } = params || {};
  return prisma.update.findMany({
    where: {
      authorId: user.id,
      appId,
      period: period,
      date: {
        gte: from ? new Date(from) : undefined,
        lte: to ? new Date(to) : undefined,
      },
    },
    orderBy: { date: "desc" },
  });
}

export async function deleteUpdate(id: string) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email as string | undefined;
  if (!email) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Unauthorized");
  const update = await prisma.update.findUnique({ where: { id } });
  if (!update || update.authorId !== user.id)
    throw new Error("Not found");
  await prisma.update.delete({ where: { id } });
  revalidatePath("/");
}
