'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';

interface Question { id: string; text: string; _count: { answers: number } }
interface Survey {
  id: string; title: string; description?: string; source?: string;
  lockedAt?: string; token: string;
  questions: Question[];
  _count: { responses: number };
}

export default function SurveyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [survey,    setSurvey]    = useState<Survey | null>(null);
  const [title,     setTitle]     = useState('');
  const [desc,      setDesc]      = useState('');
  const [source,    setSource]    = useState('');
  const [questions, setQuestions] = useState<{ text: string }[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [locking,   setLocking]   = useState(false);
  const [toast,     setToast]     = useState('');

  const load = useCallback(async () => {
    const data: Survey = await fetch(`/api/surveys/${id}`).then(r => r.json());
    setSurvey(data);
    setTitle(data.title);
    setDesc(data.description ?? '');
    setSource(data.source ?? '');
    setQuestions(data.questions.map(q => ({ text: q.text })));

    const url = `${window.location.origin}/survey/${data.token}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 });
    setQrDataUrl(dataUrl);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  async function save() {
    setSaving(true);
    const filled = questions.filter(q => q.text.trim());
    await fetch(`/api/surveys/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: desc, source, questions: filled }),
    });
    setSaving(false);
    showToast('Saved!');
    load();
  }

  async function toggleLock() {
    setLocking(true);
    const res = await fetch(`/api/surveys/${id}/lock`, { method: 'POST' }).then(r => r.json());
    setLocking(false);
    showToast(res.locked ? 'Survey locked' : 'Survey unlocked');
    load();
  }

  function addQuestion() { setQuestions(q => [...q, { text: '' }]); }
  function removeQuestion(i: number) { setQuestions(q => q.filter((_, j) => j !== i)); }
  function updateQuestion(i: number, text: string) {
    setQuestions(q => q.map((item, j) => j === i ? { text } : item));
  }

  const surveyUrl = survey ? `${typeof window !== 'undefined' ? window.location.origin : ''}/survey/${survey.token}` : '';
  const isLocked = !!survey?.lockedAt;

  if (!survey) return <p className="text-gray-400">Loading…</p>;

  return (
    <div>
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold z-50">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-4 mb-8 flex-wrap">
        <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">← Back</Link>
        <h1 className="text-2xl font-bold tracking-wide flex-1">{survey.title}</h1>
        {isLocked && <span className="text-xs bg-red-900 text-red-300 px-3 py-1 rounded-full font-bold">LOCKED</span>}
        <span className="text-blue-400 font-bold">{survey._count.responses} responses</span>
        <Link href={`/admin/surveys/${id}/results`} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl transition-colors">
          View Results
        </Link>
      </div>

      <div className="space-y-6">
        {/* QR Code */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
          <h2 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">Survey Link & QR Code</h2>
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            {qrDataUrl && (
              <div className="bg-white p-3 rounded-xl flex-shrink-0">
                <img src={qrDataUrl} alt="QR Code" className="w-36 h-36" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-gray-400 text-sm mb-2">Share this link or QR code with respondents:</p>
              <div className="bg-gray-700 rounded-xl px-4 py-3 text-blue-400 text-sm break-all font-mono mb-3">
                {surveyUrl}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { navigator.clipboard.writeText(surveyUrl); showToast('Link copied!'); }}
                  className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold px-3 py-2 rounded-lg transition-colors"
                >
                  Copy Link
                </button>
                {qrDataUrl && (
                  <a
                    href={qrDataUrl} download={`${survey.title}-qr.png`}
                    className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold px-3 py-2 rounded-lg transition-colors"
                  >
                    Download QR
                  </a>
                )}
                <button
                  onClick={toggleLock} disabled={locking}
                  className={`text-sm font-bold px-3 py-2 rounded-lg transition-colors ${
                    isLocked
                      ? 'bg-green-800 hover:bg-green-700 text-green-300'
                      : 'bg-red-900 hover:bg-red-800 text-red-300'
                  }`}
                >
                  {locking ? '…' : isLocked ? '🔓 Unlock' : '🔒 Lock Survey'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-xs font-bold tracking-widest text-gray-400 uppercase">Details</h2>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title"
            className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description"
            className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          <input value={source} onChange={e => setSource(e.target.value)} placeholder="Source"
            className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
        </div>

        {/* Questions */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
          <h2 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">Questions</h2>
          <div className="space-y-3 mb-4">
            {questions.map((q, i) => {
              const original = survey.questions[i];
              return (
                <div key={i} className="flex gap-3 items-center">
                  <span className="text-gray-500 text-sm w-6 text-right flex-shrink-0">{i + 1}</span>
                  <input value={q.text} onChange={e => updateQuestion(i, e.target.value)}
                    placeholder="Survey question…"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                  {original && (
                    <span className="text-xs text-blue-400 flex-shrink-0">{original._count.answers} answers</span>
                  )}
                  <button onClick={() => removeQuestion(i)} className="text-gray-500 hover:text-red-400 transition-colors">✕</button>
                </div>
              );
            })}
          </div>
          <button onClick={addQuestion} className="text-blue-400 hover:text-blue-300 text-sm font-bold transition-colors">
            + Add Question
          </button>
        </div>

        <button onClick={save} disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
        >
          {saving ? 'Saving…' : '💾 Save Changes'}
        </button>
      </div>
    </div>
  );
}
