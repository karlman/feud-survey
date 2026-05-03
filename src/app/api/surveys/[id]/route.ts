import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const survey = await prisma.survey.findUnique({
    where: { id: params.id },
    include: {
      questions: {
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: { select: { answers: true } },
          tabulations: { orderBy: { count: 'desc' } },
        },
      },
      _count: { select: { responses: true } },
    },
  });

  if (!survey) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(survey);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { title, description, source, questions } = await request.json();
  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });

  await prisma.question.deleteMany({ where: { surveyId: params.id } });

  const survey = await prisma.survey.update({
    where: { id: params.id },
    data: {
      title, description, source,
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

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.survey.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
