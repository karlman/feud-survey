import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { tabulateAnswers } from '@/lib/ai';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const survey = await prisma.survey.findUnique({
    where: { id: params.id },
    include: {
      questions: {
        orderBy: { sortOrder: 'asc' },
        include: { answers: { select: { text: true } } },
      },
    },
  });

  if (!survey) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  for (const question of survey.questions) {
    if (!question.answers.length) continue;

    const tabulated = await tabulateAnswers(question.text, question.answers);

    await prisma.tabulation.deleteMany({ where: { questionId: question.id } });
    await prisma.tabulation.createMany({
      data: tabulated.map(t => ({
        questionId: question.id,
        answerText: t.answerText,
        count: t.count,
        qualityScore: t.qualityScore,
      })),
    });
  }

  return NextResponse.json({ ok: true });
}
