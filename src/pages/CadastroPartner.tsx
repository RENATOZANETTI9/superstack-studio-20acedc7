import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users, Mail, Loader2, CheckCircle2,
  ArrowRight, Sparkles, TrendingUp,
  Zap, AlertTriangle, Phone, ArrowLeft,
  Pill, Wrench, HeartPulse, Megaphone, Star
} from "lucide-react";
import logoHelpude from "@/assets/logo-helpude.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const CATEGORIAS = [
  { id: "representante_farmaceutico", label: "Representante Farmacêutico", icon: Pill },
  { id: "equipamentos_cirurgias", label: "Equipamentos de Cirurgias", icon: Wrench },
  { id: "outros_saude", label: "Outros na Área de Saúde", icon: HeartPulse },
  { id: "gestor_trafego", label: "Gestor de Tráfego Médico", icon: Megaphone },
  { id: "creator_influencer", label: "Creator & Influencer", icon: Star },
];

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCPF(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function isValidPhone(phone: string) {
  return phone.replace(/\D/g, "").length >= 10;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  // Reject known invalid sequences (all same digit)
  if (/^(\d)\1{10}$/.test(digits)) return false;
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[10])) return false;
  return true;
}

const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
  <div className="flex w-fit items-center justify-center gap-2 mb-8 mx-auto">
    {Array.from({ length: totalSteps }, (_, i) => (
      <div key={i} className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500 ${
            i + 1 <= currentStep
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {i + 1 <= currentStep
            ? i + 1 < currentStep ? <CheckCircle2 className="w-4 h-4" /> : i + 1
            : i + 1}
        </div>
        {i < totalSteps - 1 && (
          <div
            className={`w-8 h-0.5 transition-all duration-500 ${
              i + 1 < currentStep ? "bg-primary" : "bg-muted"
            }`}
          />
        )}
      </div>
    ))}
  </div>
);

export default function CadastroPartner() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCategoria = (id: string) => {
    setCategoria(id);
    setTimeout(() => setStep(2), 400);
  };

  const handleSubmitDados = async () => {
    if (!nomeCompleto.trim()) {
      setError("Informe seu nome completo.");
      return;
    }
    if (!isValidCPF(cpf)) {
      setError("CPF inválido. Verifique os dígitos, incluindo os dígitos verificadores.");
      return;
    }
    setError(null);
    setStep(3);
  };

  const handleSubmitContato = async () => {
    if (!isValidEmail(email)) {
      setError("O e-mail informado não parece válido.");
      return;
    }
    if (!isValidPhone(whatsapp)) {
      setError("Informe um número de WhatsApp válido com DDD.");
      return;
    }
    if (senha.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    setError(null);
    setStep(4);
    setLoading(true);

    try {
      // Create auth user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { emailRedirectTo: window.location.origin },
      });

      if (signUpError) throw signUpError;

      const userId = signUpData.user?.id;
      if (!userId) throw new Error("Erro ao criar usuário");

      // Auto sign-in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (signInError) {
        // If auto-confirm is off, user needs to verify email first
        setLoading(false);
        setStep(5);
        return;
      }

      setLoading(false);
      setStep(5);

      // Redirect to partner simulator after 3 seconds
      setTimeout(() => {
        navigate("/dashboard/partners/simulador");
      }, 4000);
    } catch (err: any) {
      setLoading(false);
      const msg = err?.message?.includes("already been registered")
        ? "Este email já está cadastrado no sistema."
        : "Erro ao criar sua conta. Tente novamente.";
      setError(msg);
      setStep(3);
    }
  };

  const easeSmooth: [number, number, number, number] = [0.22, 1, 0.36, 1];
  const stepVariants = {
    initial: { opacity: 0, y: 20, scale: 0.97, filter: "blur(4px)" },
    animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.6, ease: easeSmooth } },
    exit: { opacity: 0, y: -15, scale: 0.97, filter: "blur(4px)", transition: { duration: 0.35, ease: easeSmooth } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--helpude-purple-dark))] via-[hsl(259,51%,20%)] to-[hsl(var(--helpude-teal-dark))] flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background logo pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img src={logoHelpude} alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-auto opacity-[0.04]" />
        <img src={logoHelpude} alt="" className="absolute top-10 left-10 w-40 h-auto opacity-[0.03] rotate-[-15deg]" />
        <img src={logoHelpude} alt="" className="absolute bottom-10 right-10 w-48 h-auto opacity-[0.03] rotate-[15deg]" />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 z-10"
      >
        <img src={logoHelpude} alt="HelpUde" className="h-10 md:h-12 w-auto" />
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-lg z-10"
      >
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-xl">
          <CardContent className="p-6 md:p-8">
            {/* Hero inside card */}
            {step <= 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center mb-6 relative"
              >
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 20px hsl(259 51% 56% / 0.3)",
                      "0 0 40px hsl(259 51% 56% / 0.5)",
                      "0 0 20px hsl(259 51% 56% / 0.3)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4"
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-semibold">Help Partner</span>
                </motion.div>
                <button
                  onClick={() => window.history.back()}
                  className="absolute top-0 left-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar
                </button>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Seja um Help Partner
                </h2>
                <p className="text-muted-foreground text-sm">
                  Cadastre-se e comece a ganhar com indicações na área da saúde
                </p>
              </motion.div>
            )}

            {step <= 3 && <StepIndicator currentStep={step} totalSteps={3} />}

            {/* Info block */}
            {step === 1 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-muted-foreground text-center mb-6 bg-muted/50 rounded-lg p-3"
              >
                Selecione sua <strong>área de atuação</strong>, preencha seus <strong>dados pessoais</strong> e <strong>contato</strong>. Após o cadastro, você terá acesso imediato ao sistema.
              </motion.p>
            )}

            <AnimatePresence mode="wait">
              {/* STEP 1 - Categoria */}
              {step === 1 && (
                <motion.div key="step1" {...stepVariants} className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">
                    Qual sua área de atuação?
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {CATEGORIAS.map((cat) => (
                      <motion.button
                        key={cat.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCategoria(cat.id)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                          categoria === cat.id
                            ? "border-primary bg-primary/10 text-primary shadow-md"
                            : "border-border bg-card hover:border-primary/40 hover:bg-accent/50 text-foreground"
                        }`}
                      >
                        <cat.icon className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-medium">{cat.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 2 - Nome e CPF */}
              {step === 2 && (
                <motion.div key="step2" {...stepVariants} className="space-y-4">
                  <label className="text-sm font-semibold text-foreground">
                    Seus dados pessoais
                  </label>
                  <Input
                    placeholder="Nome completo"
                    value={nomeCompleto}
                    onChange={(e) => {
                      setNomeCompleto(e.target.value);
                      setError(null);
                    }}
                    className="h-12"
                    autoFocus
                  />
                  <Input
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => {
                      setCpf(formatCPF(e.target.value));
                      setError(null);
                    }}
                    className="text-center text-lg font-mono tracking-wider h-12"
                  />

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
                    >
                      <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                      <p className="text-xs text-destructive">{error}</p>
                    </motion.div>
                  )}

                  <Button
                    onClick={handleSubmitDados}
                    disabled={!nomeCompleto.trim() || !isValidCPF(cpf)}
                    className="w-full h-12"
                    variant="hero"
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <button
                    onClick={() => { setStep(1); setError(null); }}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors w-full text-center"
                  >
                    ← Voltar para área de atuação
                  </button>
                </motion.div>
              )}

              {/* STEP 3 - Email, WhatsApp e Senha */}
              {step === 3 && (
                <motion.div key="step3" {...stepVariants} className="space-y-4">
                  <label className="text-sm font-semibold text-foreground">
                    Seu contato e senha de acesso
                  </label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    className="h-12"
                    autoFocus
                  />
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={whatsapp}
                      onChange={(e) => { setWhatsapp(formatPhone(e.target.value)); setError(null); }}
                      className="h-12 pl-10"
                    />
                  </div>
                  <Input
                    type="password"
                    placeholder="Crie uma senha (mín. 6 caracteres)"
                    value={senha}
                    onChange={(e) => { setSenha(e.target.value); setError(null); }}
                    className="h-12"
                  />

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
                    >
                      <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                      <p className="text-xs text-destructive">{error}</p>
                    </motion.div>
                  )}

                  <Button
                    onClick={handleSubmitContato}
                    disabled={!email || !isValidPhone(whatsapp) || senha.length < 6}
                    className="w-full h-12"
                    variant="hero"
                  >
                    Criar minha conta
                    <Zap className="w-4 h-4" />
                  </Button>
                  <button
                    onClick={() => { setStep(2); setError(null); }}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors w-full text-center"
                  >
                    ← Voltar para dados pessoais
                  </button>
                </motion.div>
              )}

              {/* STEP 4 - Loading */}
              {step === 4 && (
                <motion.div key="step4" {...stepVariants} className="flex flex-col items-center py-12 space-y-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-12 h-12 text-primary" />
                  </motion.div>
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">Criando sua conta...</h3>
                    <p className="text-sm text-muted-foreground">
                      Aguarde, estamos preparando tudo para você.
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                        className="w-2 h-2 rounded-full bg-primary"
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 5 - Confirmation */}
              {step === 5 && (
                <motion.div key="step5" {...stepVariants} className="space-y-6">
                  <div className="text-center space-y-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 10 }}
                      className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto"
                    >
                      <CheckCircle2 className="w-8 h-8 text-secondary" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-foreground">Conta criada com sucesso!</h3>
                    <p className="text-sm text-muted-foreground">
                      Você será redirecionado para o Simulador Partner.
                    </p>
                  </div>

                  <div className="bg-accent/30 rounded-xl p-5 space-y-4">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Como Help Partner você poderá:
                    </h4>
                    <ul className="space-y-3">
                      {[
                        { icon: Sparkles, text: "Indicar clínicas e ganhar bonificações" },
                        { icon: CheckCircle2, text: "Acompanhar contratos pagos da sua rede" },
                        { icon: TrendingUp, text: "Simular seus ganhos em tempo real 📈💰" },
                      ].map((item, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + i * 0.15 }}
                          className="flex items-center gap-2 text-sm text-foreground"
                        >
                          <item.icon className="w-4 h-4 text-secondary shrink-0" />
                          {item.text}
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
                  >
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Redirecionando para o Simulador...
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-xs text-primary-foreground/40 mt-6 z-10"
      >
        © {new Date().getFullYear()} HelpUde — Todos os direitos reservados
      </motion.p>
    </div>
  );
}
