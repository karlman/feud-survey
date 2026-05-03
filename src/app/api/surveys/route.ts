import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const surveys = await prisma.survey.findMany({
    include: { _count: { select: { responses: true, questions: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(surveys);
}

export async function POST(request: Request) {
  const { title, description, source, questions } = await request.json();
  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });

  const survey = await prisma.survey.create({
    data: {
      title,
      description,
      source,
      questions: {
        create: (questions ?? []).map((q: { text: string }, i: number) => ({
          text: q.text,
          sortOrder: i,
        })),
      },
    },
    include: { questions: { orderBy: { sortOrder: 'asc' } } },
  });

  return NextResponse.json(survey);
}
