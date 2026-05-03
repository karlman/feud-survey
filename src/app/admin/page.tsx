'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Survey {
  id: string;
  title: string;
  description?: string;
  source?: string;
  createdAt: string;
  lockedAt?: string;
  _count: { responses: number; questions: number };
}

export default function AdminPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await fetch('/api/surveys').then(r => r.json());
    setSurveys(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function deleteSurvey(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await fetch(`/api/surveys/${id}`, { method: 'DELETE' });
    load();
  }

  if (loading) return <p className="text-gray-400">Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-wide">SURVEYS</h1>
        <Link
          href="/admin/surveys/new"
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl transition-colors"
        >
          + New Survey
        </Link>
      </div>

      {!surveys.length && (
        <div className="text-center py-20 text-gray-500 border border-dashed border-gray-700 rounded-2xl">
          <p className="text-lg mb-2">No surveys yet</p>
          <p className="text-sm">Create your first survey to get started</p>
        </div>
      )}

      <div className="space-y-4">
        {surveys.map(s => (
          <div key={s.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h2 className="text-lg font-bold">{s.title}</h2>
                  {s.lockedAt && (
                    <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full font-bold">
                      LOCKED
                    </span>
                  )}
                </div>
                {s.description && (
                  <p className="text-gray-400 text-sm mb-2">{s.description}</p>
                )}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                  <span>{s._count.questions} questions</span>
                  <span>·</span>
                  <span className="font-bold text-blue-400">{s._count.responses} responses</span>
                  {s.source && <><span>·</span><span>{s.source}</span></>}
                  <span>·</span>
                  <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                <Link
                  href={`/admin/surveys/${s.id}`}
                  className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg transition-colors"
                >
                  Edit
                </Link>
                <Link
                  href={`/admin/surveys/${s.id}/results`}
                  className="bg-blue-700 hover:bg-blue-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg transition-colors"
                >
                  Results
                </Link>
                <button
                  onClick={() => deleteSurvey(s.id, s.title)}
                  className="bg-gray-700 hover:bg-red-900 text-gray-400 hover:text-red-300 text-sm font-bold px-3 py-1.5 rounded-lg transition-colors"
                >
                  🗑
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
