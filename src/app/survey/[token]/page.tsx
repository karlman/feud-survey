'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Question { id: string; text: string }
interface SurveyData { title: string; description?: string; questions: Question[] }

function randomToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const RESPONDENT_KEY = 'feud-survey-respondent';
function getRespondentToken() {
  if (typeof localStorage === 'undefined') return randomToken();
  let t = localStorage.getItem(RESPONDENT_KEY);
  if (!t) { t = randomToken(); localStorage.setItem(RESPONDENT_KEY, t); }
  return t;
}

export default function SurveyPage() {
  const { token } = useParams<{ token: string }>();
  const [survey,    setSurvey]    = useState<SurveyData | null>(null);
  const [answers,   setAnswers]   = useState<Record<string, string>>({});
  const [status,    setStatus]    = useState<'loading' | 'open' | 'closed' | 'done' | 'error'>('loading');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/submit/${token}`)
      .then(async r => {
        if (r.status === 403) { setStatus('closed'); return; }
        if (!r.ok) { setStatus('error'); return; }
        const data = await r.json();
        setSurvey(data);
        setStatus('open');
      })
      .catch(() => setStatus('error'));
  }, [token]);

  function setAnswer(questionId: string, text: string) {
    setAnswers(a => ({ ...a, [questionId]: text }));
  }

  async function submit() {
    if (!survey) return;
    const filled = survey.questions
      .map(q => ({ questionId: q.id, text: answers[q.id] ?? '' }))
      .filter(a => a.text.trim());

    if (!filled.length) return;

    setSubmitting(true);
    const res = await fetch(`/api/submit/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ respondentToken: getRespondentToken(), answers: filled }),
    }).then(r => r.json());

    setSubmitting(false);
    if (res.ok) setStatus('done');
  }

  const answeredCount = survey ? survey.questions.filter(q => answers[q.id]?.trim()).length : 0;

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading survey…</p>
      </div>
    );
  }

  if (status === 'closed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Survey Closed</h1>
          <p className="text-gray-500">This survey is no longer accepting responses.</p>
        </div>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Thanks!</h1>
          <p className="text-gray-500">Your responses have been recorded.</p>
        </div>
      </div>
    );
  }

  if (status === 'error' || !survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🤷</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Survey Not Found</h1>
          <p className="text-gray-500">This survey link may be invalid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-700 text-white px-4 py-6 text-center">
        <h1 className="text-2xl font-bold mb-1">{survey.title}</h1>
        {survey.description && <p className="text-blue-200 text-sm">{survey.description}</p>}
        <p className="text-blue-200 text-xs mt-2">Answer as many questions as you like — skip any you're unsure about</p>
      </div>

      {/* Progress */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3 sticky top-0">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${(answeredCount / survey.questions.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 font-medium flex-shrink-0">
          {answeredCount} / {survey.questions.length}
        </span>
      </div>

      {/* Questions */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {survey.questions.map((q, i) => (
          <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              Question {i + 1}
            </p>
            <p className="text-gray-800 font-semibold text-lg leading-snug mb-4">{q.text}</p>
            <input
              type="text"
              value={answers[q.id] ?? ''}
              onChange={e => setAnswer(q.id, e.target.value)}
              placeholder="Your answer…"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-base"
            />
          </div>
        ))}

        <button
          onClick={submit}
          disabled={submitting || answeredCount === 0}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold py-4 rounded-2xl transition-colors text-lg"
        >
          {submitting ? 'Submitting…' : `Submit ${answeredCount > 0 ? `(${answeredCount} answer${answeredCount !== 1 ? 's' : ''})` : ''}`}
        </button>

        <p className="text-center text-gray-400 text-xs pb-8">
          Responses are anonymous and used for a Family Feud game.
        </p>
      </div>
    </div>
  );
}
