import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Calculator, Network, DollarSign, Megaphone, BarChart3,
  ChevronRight, X, Sparkles, CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const STEPS = [
  {
    icon: Sparkles,
    title: 'Bem-vindo ao Help Partner! 🎉',
    description: 'Você agora faz parte da rede de parceiros HelpUde. Vamos conhecer as principais funcionalidades disponíveis para você.',
    color: 'text-primary',
  },
  {
    icon: Calculator,
    title: 'Simulador de Projeção',
    description: 'Simule seus ganhos ajustando número de clínicas, simulações por mês e ticket médio. Veja em tempo real o funil de conversão e sua bonificação estimada.',
    color: 'text-orange-500',
  },
  {
    icon: Network,
    title: 'Rede de Parceiros',
    description: 'Acompanhe as clínicas vinculadas à sua rede, veja quais estão ativas e monitore o desempenho de cada uma com dados de simulações, aprovações e pagamentos.',
    color: 'text-blue-500',
  },
  {
    icon: DollarSign,
    title: 'Bonificações',
    description: 'Veja suas comissões diretas (1.6%) e override (0.2%), acompanhe a evolução mensal e entenda os tiers de bonificação disponíveis.',
    color: 'text-green-500',
  },
  {
    icon: Megaphone,
    title: 'Marketing',
    description: 'Acesse materiais de divulgação, links personalizados para indicar clínicas e ferramentas para expandir sua rede de parceiros.',
    color: 'text-purple-500',
  },
  {
    icon: BarChart3,
    title: 'Simulações Clínicas',
    description: 'Analise o desempenho detalhado de cada clínica da sua rede com gráficos de evolução e métricas de conversão.',
    color: 'text-teal-500',
  },
];

const STORAGE_KEY = 'helpude_partner_onboarding_completed';

export default function PartnerOnboarding() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    const key = `${STORAGE_KEY}_${user.id}`;
    const completed = localStorage.getItem(key);
    if (!completed) {
      setShow(true);
    }
  }, [user]);

  const handleComplete = () => {
    if (user) {
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, 'true');
    }
    setShow(false);
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  if (!show) return null;

  const currentStep = STEPS[step];
  const Icon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i <= step ? 'bg-primary w-6' : 'bg-muted w-3'
                }`}
              />
            ))}
          </div>
          <Button variant="ghost" size="icon" onClick={handleComplete} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className={`w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto ${currentStep.color}`}>
                <Icon className="w-8 h-8" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-foreground">{currentStep.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{currentStep.description}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{step + 1} de {STEPS.length}</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleComplete}>
              Pular
            </Button>
            <Button size="sm" onClick={handleNext} className="gap-1">
              {step === STEPS.length - 1 ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Começar
                </>
              ) : (
                <>
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
