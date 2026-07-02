import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const schema = z.object({ email: z.string().trim().email('Email inválido').max(255) });

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Email inválido');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (err) {
      setError('Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.');
      toast.error('Falha ao enviar e-mail de recuperação');
      return;
    }
    setSent(true);
    toast.success('E-mail de recuperação enviado');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Button variant="ghost" onClick={() => navigate('/auth')} className="mb-6 text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para login
        </Button>

        <div className="glass-card rounded-2xl p-8 shadow-2xl border border-border/50">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold gradient-text mb-2">Recuperar conta</h1>
            <p className="text-muted-foreground text-sm">
              Informe seu e-mail cadastrado. Enviaremos um link seguro para você redefinir sua senha.
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-14 h-14 text-success mx-auto" />
              <h2 className="text-xl font-semibold">Verifique sua caixa de entrada</h2>
              <p className="text-muted-foreground text-sm">
                Se <strong>{email}</strong> estiver cadastrado, você receberá um link em instantes.
                Não esqueça de conferir a pasta de spam.
              </p>
              <Button variant="outline" className="w-full" onClick={() => { setSent(false); setEmail(''); }}>
                Enviar para outro e-mail
              </Button>
              <Button className="w-full" onClick={() => navigate('/auth')}>Voltar para login</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                    autoFocus
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;