'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Link href="/admin" className="text-yellow-400 font-bold text-lg tracking-widest hover:text-yellow-300">
          🎮 FEUD SURVEY
        </Link>
        <button onClick={logout} className="text-gray-400 hover:text-white text-sm transition-colors">
          Sign out
        </button>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
