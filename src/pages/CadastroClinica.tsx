import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Stethoscope, Building2, Mail, Loader2, CheckCircle2,
  ArrowRight, Sparkles, TrendingUp, Bot, MessageSquare,
  RotateCcw, ChevronRight, Shield, Zap, AlertTriangle, Phone, ArrowLeft } from
"lucide-react";
import logoHelpude from "@/assets/logo-helpude.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ESPECIALIDADES = [
{ id: "saude", label: "Outras área da saúde", icon: Stethoscope },
{ id: "odontologia", label: "Odontologia", icon: Stethoscope },
{ id: "ortopedia", label: "Ortopedia", icon: Stethoscope },
{ id: "estetica", label: "Estética", icon: Sparkles }];


function formatCNPJ(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits.
  replace(/^(\d{2})(\d)/, "$1.$2").
  replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").
  replace(/\.(\d{3})(\d)/, ".$1/$2").
  replace(/(\d{4})(\d)/, "$1-$2");
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isValidPhone(phone: string) {
  return phone.replace(/\D/g, "").length >= 10;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidCNPJ(cnpj: string) {
  return cnpj.replace(/\D/g, "").length === 14;
}

const StepIndicator = ({ currentStep, totalSteps }: {currentStep: number;totalSteps: number;}) =>
<div className="flex w-fit items-center justify-center gap-2 mb-8 mx-auto">
    {Array.from({ length: totalSteps }, (_, i) =>
  <div key={i} className="flex items-center gap-2">
        <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500 ${
      i + 1 <= currentStep ?
      "bg-primary text-primary-foreground shadow-lg" :
      "bg-muted text-muted-foreground"}`
      }>
      
          {i + 1 <= currentStep ?
      i + 1 < currentStep ? <CheckCircle2 className="w-4 h-4" /> : i + 1 :

      i + 1
      }
        </div>
        {i < totalSteps - 1 &&
    <div
      className={`w-8 h-0.5 transition-all duration-500 ${
      i + 1 < currentStep ? "bg-primary" : "bg-muted"}`
      } />

    }
      </div>
  )}
  </div>;


export default function CadastroClinica() {
  const [step, setStep] = useState(1);
  const [especialidade, setEspecialidade] = useState<string | null>(null);
  const [cnpj, setCnpj] = useState("");
  const [cnpjValido, setCnpjValido] = useState(false);
  const [razaoSocial, setRazaoSocial] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validatingCnpj, setValidatingCnpj] = useState(false);

  const handleEspecialidade = (id: string) => {
    setEspecialidade(id);
    setTimeout(() => setStep(2), 400);
  };

  const handleCnpjValidation = async () => {
    if (!isValidCNPJ(cnpj)) {
      setError("CNPJ inválido. Verifique os dígitos.");
      return;
    }
    setValidatingCnpj(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("validate-cnpj", {
        body: { cnpj: cnpj.replace(/\D/g, "") }
      });

      if (fnError) throw fnError;

      if (data?.valido && data?.area === "medica") {
        setCnpjValido(true);
        setRazaoSocial(data.razao_social || "");
        setTimeout(() => setStep(3), 400);
      } else {
        setError(
          "Esse CNPJ não está vinculado à área da saúde. No momento, o sistema é exclusivo para clínicas. Se tiver outro CNPJ da área médica, pode tentar novamente."
        );
      }
    } catch {
      setError("Erro ao validar CNPJ. Tente novamente.");
    } finally {
      setValidatingCnpj(false);
    }
  };

  const handleSubmitEmail = async () => {
    if (!isValidEmail(email)) {
      setError("O e-mail informado não parece válido. Por favor, revise para continuar.");
      return;
    }
    if (!isValidPhone(whatsapp)) {
      setError("Informe um número de WhatsApp válido com DDD.");
      return;
    }
    setError(null);
    setStep(4);
    setLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("register-clinic", {
        body: {
          cnpj: cnpj.replace(/\D/g, ""),
          email,
          whatsapp: whatsapp.replace(/\D/g, ""),
          especialidade,
          razao_social: razaoSocial
        }
      });

      if (fnError) throw fnError;

      setLoading(false);
      setStep(5);

      // Auto-redirect after 5 seconds
      if (data?.redirect_url) {
        setTimeout(() => {
          window.location.href = data.redirect_url;
        }, 5000);
      }
    } catch {
      setLoading(false);
      setError("Erro ao criar sua conta. Tente novamente.");
      setStep(3);
    }
  };

  const easeSmooth: [number, number, number, number] = [0.22, 1, 0.36, 1];
  const stepVariants = {
    initial: { opacity: 0, y: 20, scale: 0.97, filter: "blur(4px)" },
    animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.6, ease: easeSmooth } },
    exit: { opacity: 0, y: -15, scale: 0.97, filter: "blur(4px)", transition: { duration: 0.35, ease: easeSmooth } }
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
        className="mb-6 z-10">
        <img src={logoHelpude} alt="HelpUde" className="h-10 md:h-12 w-auto" />
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-lg z-10">
        
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-xl">
          <CardContent className="p-6 md:p-8">
            {/* Hero inside card for steps 1-3 */}
            {step <= 3 &&
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mb-6 relative">
              
                <motion.div
                animate={{
                  boxShadow: [
                  "0 0 20px hsl(259 51% 56% / 0.3)",
                  "0 0 40px hsl(259 51% 56% / 0.5)",
                  "0 0 20px hsl(259 51% 56% / 0.3)"]

                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
                
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm font-semibold">Cadastro de Clínica</span>
                </motion.div>
                <button
                  onClick={() => window.history.back()}
                  className="absolute top-0 left-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar
                </button>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">O Banco da sua clínica

              </h2>
                <p className="text-muted-foreground text-sm">
                  Veja como aumentar seu faturamento com aprovação de crédito para pacientes
                </p>
              </motion.div>
            }

            {step <= 3 && <StepIndicator currentStep={step} totalSteps={3} />}

            {/* Info block */}
            {step === 1 &&
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
className="text-xs text-muted-foreground text-center mb-6 bg-muted/50 rounded-lg p-3">
  Para começar, precisamos de 3 informações: sua especialidade, seu CNPJ e seu e-mail. Se o CNPJ for da área da saúde, você já recebe acesso automático ao sistema..
</motion.p>
            }

            <AnimatePresence mode="wait">
              {/* STEP 1 - Especialidade */}
              {step === 1 &&
              <motion.div key="step1" {...stepVariants} className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">
                    Qual a especialidade da sua clínica?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {ESPECIALIDADES.map((esp) =>
                  <motion.button
                    key={esp.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleEspecialidade(esp.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 ${
                    especialidade === esp.id ?
                    "border-primary bg-primary/10 text-primary shadow-md" :
                    "border-border bg-card hover:border-primary/40 hover:bg-accent/50 text-foreground"}`
                    }>
                    
                        <esp.icon className="w-6 h-6" />
                        <span className="text-xs font-medium text-center">{esp.label}</span>
                      </motion.button>
                  )}
                  </div>
                </motion.div>
              }

              {/* STEP 2 - CNPJ */}
              {step === 2 &&
              <motion.div key="step2" {...stepVariants} className="space-y-4">
                  <label className="text-sm font-semibold text-foreground">
                    Informe o CNPJ da sua clínica
                  </label>
                  <Input
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChange={(e) => {
                    setCnpj(formatCNPJ(e.target.value));
                    setError(null);
                  }}
                  className="text-center text-lg font-mono tracking-wider h-12"
                  autoFocus />
                
                  {error &&
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  
                      <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                      <p className="text-xs text-destructive">{error}</p>
                    </motion.div>
                }
                  <Button
                  onClick={handleCnpjValidation}
                  disabled={!isValidCNPJ(cnpj) || validatingCnpj}
                  className="w-full h-12"
                  variant="hero">
                  
                    {validatingCnpj ?
                  <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Validando CNPJ...
                      </> :

                  <>
                        Validar CNPJ
                        <ArrowRight className="w-4 h-4" />
                      </>
                  }
                  </Button>
                  <button
                  onClick={() => {setStep(1);setError(null);}}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors w-full text-center">
                  
                    ← Voltar para especialidade
                  </button>
                </motion.div>
              }

              {/* STEP 3 - Email */}
              {step === 3 &&
              <motion.div key="step3" {...stepVariants} className="space-y-4">
                  {razaoSocial &&
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-3 bg-secondary/10 border border-secondary/20 rounded-lg">
                  
                      <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                      <p className="text-xs text-secondary font-medium">{razaoSocial}</p>
                    </motion.div>
                }
                  <label className="text-sm font-semibold text-foreground">
                    Informe seu e-mail e WhatsApp
                  </label>
                  <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className="h-12"
                  autoFocus />
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={whatsapp}
                    onChange={(e) => {
                      setWhatsapp(formatPhone(e.target.value));
                      setError(null);
                    }}
                    className="h-12 pl-10" />
                  </div>
                
                  {error &&
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  
                      <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                      <p className="text-xs text-destructive">{error}</p>
                    </motion.div>
                }
                  <Button
                  onClick={handleSubmitEmail}
                  disabled={!email || !isValidPhone(whatsapp)}
                  className="w-full h-12"
                  variant="hero">
                  
                    Liberar meu acesso
                    <Zap className="w-4 h-4" />
                  </Button>
                  <button
                  onClick={() => {setStep(2);setError(null);}}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors w-full text-center">
                  
                    ← Voltar para CNPJ
                  </button>
                </motion.div>
              }

              {/* STEP 4 - Loading */}
              {step === 4 &&
              <motion.div key="step4" {...stepVariants} className="flex flex-col items-center py-12 space-y-6">
                  <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                  
                    <Loader2 className="w-12 h-12 text-primary" />
                  </motion.div>
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">Validando informações...</h3>
                    <p className="text-sm text-muted-foreground">
                      Você será redirecionado para o sistema com acesso liberado.
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) =>
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                    className="w-2 h-2 rounded-full bg-primary" />

                  )}
                  </div>
                </motion.div>
              }

              {/* STEP 5 - Confirmation */}
              {step === 5 &&
              <motion.div key="step5" {...stepVariants} className="space-y-6">
                  <div className="text-center space-y-3">
                    <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10 }}
                    className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto">
                    
                      <CheckCircle2 className="w-8 h-8 text-secondary" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-foreground">Acesso liberado!</h3>
                    <p className="text-sm text-muted-foreground">
                      Você está sendo direcionado para o sistema.
                    </p>
                  </div>

                  <div className="bg-accent/30 rounded-xl p-5 space-y-4">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Com a HelpUde você poderá:
                    </h4>
                    <ul className="space-y-3">
                      {[
                    { icon: Shield, text: "Simular crédito para seus pacientes" },
                    { icon: CheckCircle2, text: "Aprovar mais procedimentos" },
                    { icon: TrendingUp, text: "Aumentar seu faturamento sem reduzir preços 📈💰" }].
                    map((item, i) =>
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.15 }}
                      className="flex items-center gap-2 text-sm text-foreground">
                      
                          <item.icon className="w-4 h-4 text-secondary shrink-0" />
                          {item.text}
                        </motion.li>
                    )}
                    </ul>

                    <div className="border-t border-border pt-3">
                      <h4 className="text-sm font-bold text-foreground mb-3">E mais:</h4>
                      <ul className="space-y-3">
                        {[
                      { icon: RotateCcw, text: "Reativar pacientes automaticamente 🔄" },
                      { icon: MessageSquare, text: "Disparar SMS e e-mail com a identidade da sua clínica 📩" },
                      { icon: Bot, text: "Usar nossa IA de ligação para chamar pacientes aprovados 🤖📞" }].
                      map((item, i) =>
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + i * 0.15 }}
                        className="flex items-center gap-2 text-sm text-foreground">
                        
                            <item.icon className="w-4 h-4 text-primary shrink-0" />
                            {item.text}
                          </motion.li>
                      )}
                      </ul>
                    </div>

                    <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="text-xs text-muted-foreground italic text-center pt-2">
                    
                      Tudo feito como se fosse a sua clínica falando com o paciente.
                    </motion.p>
                  </div>

                  <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Redirecionando...
                  </motion.div>
                </motion.div>
              }
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-xs text-primary-foreground/40 mt-6 z-10">
        
        © {new Date().getFullYear()} HelpUde — Todos os direitos reservados
      </motion.p>
    </div>);

}