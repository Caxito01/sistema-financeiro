'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <nav className="flex items-center justify-between bg-blue-600 p-4 text-white">
      <div>
        <h1 className="text-xl font-bold">💰 Sistema Financeiro</h1>
      </div>
      <button
        onClick={handleLogout}
        className="rounded-md bg-red-500 px-4 py-2 hover:bg-red-600 transition"
      >
        Sair
      </button>
    </nav>
  );
}
