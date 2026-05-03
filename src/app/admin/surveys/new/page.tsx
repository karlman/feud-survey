'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Question { text: string }

export default function NewSurveyPage() {
  const router = useRouter();
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [source,      setSource]      = useState('');
  const [questions,   setQuestions]   = useState<Question[]>([{ text: '' }]);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  function addQuestion() { setQuestions(q => [...q, { text: '' }]); }
  function removeQuestion(i: number) { setQuestions(q => q.filter((_, j) => j !== i)); }
  function updateQuestion(i: number, text: string) {
    setQuestions(q => q.map((item, j) => j === i ? { text } : item));
  }

  async function save() {
    if (!title.trim()) { setError('Title is required'); return; }
    const filled = questions.filter(q => q.text.trim());
    if (!filled.length) { setError('Add at least one question'); return; }

    setSaving(true);
    setError('');

    const res = await fetch('/api/surveys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, source, questions: filled }),
    }).then(r => r.json());

    if (res.error) { setError(res.error); setSaving(false); return; }
    router.push(`/admin/surveys/${res.id}`);
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">← Back</Link>
        <h1 className="text-2xl font-bold tracking-wide">NEW SURVEY</h1>
      </div>

      <div className="space-y-6">
        {/* Metadata */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-xs font-bold tracking-widest text-gray-400 uppercase">Details</h2>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Holiday Party 2024"
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</label>
            <input
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Optional notes"
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Source</label>
            <input
              value={source} onChange={e => setSource(e.target.value)}
              placeholder="e.g. Office party, Family reunion"
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Questions */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
          <h2 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">Questions</h2>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={i} className="flex gap-3 items-center">
                <span className="text-gray-500 text-sm w-6 text-right flex-shrink-0">{i + 1}</span>
                <input
                  value={q.text} onChange={e => updateQuestion(i, e.target.value)}
                  placeholder={`Name something you find in a kitchen…`}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                {questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(i)}
                    className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addQuestion}
            className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-bold transition-colors"
          >
            + Add Question
          </button>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3">
          <Link href="/admin" className="flex-1 text-center bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-colors">
            Cancel
          </Link>
          <button
            onClick={save} disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {saving ? 'Creating…' : 'Create Survey'}
          </button>
        </div>
      </div>
    </div>
  );
}
