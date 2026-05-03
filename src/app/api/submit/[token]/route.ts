import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const survey = await prisma.survey.findUnique({
    where: { token: params.token },
    include: { questions: { orderBy: { sortOrder: 'asc' } } },
  });

  if (!survey) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (survey.lockedAt) return NextResponse.json({ error: 'Survey is closed' }, { status: 403 });

  return NextResponse.json({
    id: survey.id,
    title: survey.title,
    description: survey.description,
    questions: survey.questions.map(q => ({ id: q.id, text: q.text })),
  });
}

export async function POST(request: Request, { params }: { params: { token: string } }) {
  const survey = await prisma.survey.findUnique({
    where: { token: params.token },
    include: { questions: true },
  });

  if (!survey) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (survey.lockedAt) return NextResponse.json({ error: 'Survey is closed' }, { status: 403 });

  const { respondentToken, answers } = await request.json() as {
    respondentToken: string;
    answers: { questionId: string; text: string }[];
  };

  const validIds = new Set(survey.questions.map(q => q.id));
  const validAnswers = (answers ?? []).filter(
    a => a.text?.trim() && validIds.has(a.questionId)
  );

  if (!validAnswers.length) {
    return NextResponse.json({ error: 'No valid answers provided' }, { status: 400 });
  }

  await prisma.response.create({
    data: {
      surveyId: survey.id,
      respondentToken,
      answers: {
        create: validAnswers.map(a => ({
          questionId: a.questionId,
          text: a.text.trim(),
        })),
      },
    },
  });

  return NextResponse.json({ ok: true });
}
