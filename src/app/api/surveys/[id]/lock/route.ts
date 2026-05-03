import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const survey = await prisma.survey.findUnique({ where: { id: params.id } });
  if (!survey) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.survey.update({
    where: { id: params.id },
    data: { lockedAt: survey.lockedAt ? null : new Date() },
  });

  return NextResponse.json({ locked: !!updated.lockedAt });
}
