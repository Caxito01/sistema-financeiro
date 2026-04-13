'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function NovaSenhaPage() {
  const router = useRouter();
  const [nova, setNova] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [tokenValido, setTokenValido] = useState(false);

  useEffect(() => {
    // O Supabase envia o token no hash da URL: #access_token=...&type=recovery
    // O cliente Supabase já processa o hash automaticamente ao inicializar
    const supabase = createClient();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setTokenValido(true);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (nova.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (nova !== confirmar) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({ password: nova });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSucesso(true);
    setTimeout(() => router.push('/login'), 3000);
  };

  if (!tokenValido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              💰 Sistema Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md text-sm text-center">
              ⏳ Aguardando token de recuperação... <br />
              Se você chegou aqui diretamente, solicite um novo link de recuperação.
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <Link href="/recuperar-senha" className="text-blue-600 hover:underline text-sm font-medium">
              Solicitar novo link
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            💰 Sistema Financeiro
          </CardTitle>
          <CardDescription className="text-center">
            Criar nova senha
          </CardDescription>
        </CardHeader>

        {sucesso ? (
          <CardContent className="space-y-4">
            <div className="bg-green-50 text-green-700 p-4 rounded-md text-sm text-center">
              ✅ Senha alterada com sucesso! Redirecionando para o login...
            </div>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="nova">Nova senha</Label>
                <Input
                  id="nova"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={nova}
                  onChange={(e) => setNova(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmar">Confirmar nova senha</Label>
                <Input
                  id="confirmar"
                  type="password"
                  placeholder="Repita a nova senha"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </Button>

              <p className="text-sm text-center text-slate-600">
                <Link href="/login" className="text-blue-600 hover:underline font-medium">
                  Voltar ao login
                </Link>
              </p>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
