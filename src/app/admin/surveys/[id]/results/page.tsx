'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Tabulation { answerText: string; count: number; qualityScore?: number }
interface Question {
  id: string; text: string;
  _count: { answers: number };
  tabulations: Tabulation[];
}
interface Survey {
  id: string; title: string; lockedAt?: string;
  questions: Question[];
  _count: { responses: number };
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [survey,     setSurvey]     = useState<Survey | null>(null);
  const [tabulating, setTabulating] = useState(false);
  const [toast,      setToast]      = useState('');

  const load = useCallback(async () => {
    const data: Survey = await fetch(`/api/surveys/${id}`).then(r => r.json());
    setSurvey(data);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function runTabulation() {
    setTabulating(true);
    showToast('Running AI tabulation… this may take a moment');
    const res = await fetch(`/api/surveys/${id}/tabulate`, { method: 'POST' }).then(r => r.json());
    setTabulating(false);
    if (res.ok) { showToast('Tabulation complete!'); load(); }
    else showToast('Tabulation failed: ' + res.error);
  }

  function exportJson() {
    window.open(`/api/surveys/${id}/export`, '_blank');
  }

  if (!survey) return <p className="text-gray-400">Loading…</p>;

  const totalResponses = survey._count.responses;
  const hasTabulations = survey.questions.some(q => q.tabulations.length > 0);

  return (
    <div>
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold z-50 text-center max-w-xs">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-4 mb-8 flex-wrap">
        <Link href={`/admin/surveys/${id}`} className="text-gray-400 hover:text-white transition-colors">← Edit</Link>
        <h1 className="text-2xl font-bold tracking-wide flex-1">{survey.title}</h1>
        <span className="text-blue-400 font-bold">{totalResponses} responses</span>
      </div>

      {/* Actions */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-400">
            {totalResponses === 0
              ? 'No responses yet. Share the survey link to start collecting.'
              : `${totalResponses} response${totalResponses !== 1 ? 's' : ''} collected across ${survey.questions.length} questions.`}
          </p>
        </div>
        <button
          onClick={runTabulation} disabled={tabulating || totalResponses === 0}
          className="bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl transition-colors text-sm"
        >
          {tabulating ? '⏳ Tabulating…' : '🤖 Run AI Tabulation'}
        </button>
        {hasTabulations && (
          <button
            onClick={exportJson}
            className="bg-green-700 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-xl transition-colors text-sm"
          >
            ⬇ Export JSON
          </button>
        )}
      </div>

      {/* Per-question results */}
      <div className="space-y-6">
        {survey.questions.map((q, qi) => (
          <div key={q.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Question {qi + 1}</p>
                <h3 className="text-lg font-bold">{q.text}</h3>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`text-2xl font-bold ${q._count.answers >= 100 ? 'text-green-400' : 'text-blue-400'}`}>
                  {q._count.answers}
                </div>
                <div className="text-xs text-gray-500">/ 100 target</div>
              </div>
            </div>

            {/* Progress bar toward 100 responses */}
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (q._count.answers / 100) * 100)}%` }}
              />
            </div>

            {q.tabulations.length > 0 ? (
              <div className="space-y-2">
                {q.tabulations.map((t, ti) => (
                  <div key={ti} className="flex items-center gap-3">
                    <span className="text-gray-500 text-sm w-5 text-right">{ti + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-sm">{t.answerText}</span>
                        <div className="flex items-center gap-2">
                          {t.qualityScore !== undefined && (
                            <span className="text-xs text-gray-500">Q:{Math.round(t.qualityScore)}</span>
                          )}
                          <span className="text-blue-400 font-bold text-sm">{t.count}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, (t.count / Math.max(1, q._count.answers)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                {q._count.answers > 0
                  ? 'Run AI Tabulation to group and rank answers'
                  : 'No answers yet'}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
