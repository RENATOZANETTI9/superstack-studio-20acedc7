import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { passwordResetSchema, evaluatePassword, PASSWORD_MIN_LENGTH } from '@/lib/password-policy';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase places the recovery session in URL hash; SDK auto-processes it.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setReady(true);
      }
    });
    // Also check immediately (in case listener missed the initial event)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else if (!window.location.hash.includes('access_token')) {
        setLinkError('Link inválido ou expirado. Solicite um novo e-mail de recuperação.');
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const parsed = passwordResetSchema.safeParse({ password, confirm });
    if (!parsed.success) {
      setErr(parsed.error.errors[0]?.message ?? 'Senha inválida');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setErr(error.message);
      toast.error('Falha ao atualizar senha');
      return;
    }
    setDone(true);
    toast.success('Senha redefinida com sucesso');
    await supabase.auth.signOut();
    setTimeout(() => navigate('/auth'), 1500);
  };

  const strength = evaluatePassword(password);
  const strengthLabels = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte', 'Excelente'];
  const strengthColors = [
    'bg-destructive',
    'bg-destructive',
    'bg-warning',
    'bg-warning',
    'bg-success',
    'bg-success',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass-card rounded-2xl p-8 shadow-2xl border border-border/50">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold gradient-text mb-2">Nova senha</h1>
            <p className="text-muted-foreground text-sm">Escolha uma senha segura para acessar sua conta.</p>
          </div>

          {linkError ? (
            <div className="text-center space-y-4">
              <AlertCircle className="w-14 h-14 text-destructive mx-auto" />
              <p className="text-sm text-muted-foreground">{linkError}</p>
              <Button className="w-full" onClick={() => navigate('/forgot-password')}>
                Solicitar novo link
              </Button>
            </div>
          ) : done ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-14 h-14 text-success mx-auto" />
              <p>Senha atualizada! Redirecionando para o login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="pw">Nova senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="pl-10" disabled={loading || !ready} />
                </div>
                {password && (
                  <div className="space-y-1.5" data-testid="password-strength">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded ${
                            i < strength.score ? strengthColors[strength.score] : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Força: <span className="font-medium">{strengthLabels[strength.score]}</span>
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      <li className={strength.checks.length ? 'text-success' : ''}>
                        {strength.checks.length ? '✓' : '•'} Pelo menos {PASSWORD_MIN_LENGTH} caracteres
                      </li>
                      <li className={strength.checks.lowercase ? 'text-success' : ''}>
                        {strength.checks.lowercase ? '✓' : '•'} Uma letra minúscula
                      </li>
                      <li className={strength.checks.uppercase ? 'text-success' : ''}>
                        {strength.checks.uppercase ? '✓' : '•'} Uma letra maiúscula
                      </li>
                      <li className={strength.checks.number ? 'text-success' : ''}>
                        {strength.checks.number ? '✓' : '•'} Um número
                      </li>
                      <li className={strength.checks.special ? 'text-success' : ''}>
                        {strength.checks.special ? '✓' : '•'} Um caractere especial
                      </li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw2">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input id="pw2" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    className="pl-10" disabled={loading || !ready} />
                </div>
                {confirm && password !== confirm && (
                  <p className="text-xs text-destructive">As senhas não coincidem</p>
                )}
              </div>
              {err && <p className="text-sm text-destructive">{err}</p>}
              {!ready && <p className="text-xs text-muted-foreground text-center">Validando link de recuperação...</p>}
              <Button type="submit" className="w-full" disabled={loading || !ready}>
                {loading ? 'Atualizando...' : 'Redefinir senha'}
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;