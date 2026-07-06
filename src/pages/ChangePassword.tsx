import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ChangePassword() {
  const { user, isLoading, mustChangePassword, refreshMustChangePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  if (isLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!mustChangePassword) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      toast.error('As senhas não coincidem.');
      return;
    }
    setSaving(true);
    try {
      const { error: pwdErr } = await supabase.auth.updateUser({ password });
      if (pwdErr) {
        toast.error(pwdErr.message);
        return;
      }
      const { error: profErr } = await supabase
        .from('profiles')
        .update({ must_change_password: false } as any)
        .eq('user_id', user.id);
      if (profErr) {
        toast.error('Senha alterada, mas não foi possível atualizar o perfil.');
        return;
      }
      await refreshMustChangePassword();
      toast.success('Senha atualizada. Bem-vindo(a)!');
      navigate('/dashboard', { replace: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Primeiro acesso — defina sua senha</CardTitle>
          <CardDescription>
            Por segurança, você precisa criar uma nova senha antes de continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar senha</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar e entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}