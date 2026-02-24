import { motion } from 'framer-motion';
import { Check, FileText, Lock, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlanFeature {
  text: string;
  points?: string;
}

interface PlanRequirement {
  text: string;
}

interface Plan {
  name: string;
  subtitle: string;
  consultasLimit: string;
  description: string;
  features: PlanFeature[];
  requirements?: PlanRequirement[];
  popular: boolean;
  icon: React.ReactNode;
}

const plans: Plan[] = [
  {
    name: 'Nível Básico',
    subtitle: 'Starter',
    consultasLimit: '50 consultas aprovadas/mês',
    description: 'Ideal para clínicas iniciando com crédito',
    icon: <Zap className="w-5 h-5" />,
    features: [
      { text: 'Consultas individuais', points: '50 Pontos Help' },
      { text: 'Pipeline de propostas' },
      { text: 'Envio de SMS', points: '50 Pontos Help' },
      { text: 'Ligações por IA', points: '50 Pontos Help' },
      { text: 'Envio de email marketing', points: '50 Pontos Help' },
    ],
    popular: false,
  },
  {
    name: 'Nível Profissional',
    subtitle: 'Professional',
    consultasLimit: '1.000 consultas aprovadas/mês',
    description: 'Para clínicas em crescimento',
    icon: <Star className="w-5 h-5" />,
    features: [
      { text: 'Consultas individuais', points: '1000 Pontos Help' },
      { text: 'Consultas em lote', points: '1000 Pontos Help' },
      { text: 'Envio de SMS', points: '1000 Pontos Help' },
      { text: 'Ligações por IA', points: '1000 Pontos Help' },
      { text: 'Envio de email marketing', points: '1000 Pontos Help' },
    ],
    requirements: [
      { text: 'Aprovação cadastral' },
      { text: 'Contrato social' },
      { text: 'Documentação da empresa' },
    ],
    popular: true,
  },
  {
    name: 'Nível Enterprise',
    subtitle: 'Enterprise',
    consultasLimit: 'Ilimitado',
    description: 'Para redes de clínicas',
    icon: <Lock className="w-5 h-5" />,
    features: [
      { text: 'Tudo do Combo Profissional', points: 'Ilimitado' },
      { text: 'Suporte dedicado 24/7' },
      { text: 'Customização de regras' },
      { text: 'Webhooks em tempo real' },
    ],
    requirements: [
      { text: 'Toda documentação do Combo Profissional' },
      { text: 'Análise de histórico dos últimos 90 dias' },
      { text: 'Aprovação cadastral especial' },
    ],
    popular: false,
  },
];

const Pricing = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
            Níveis que sua clínica{' '}
            <span className="gradient-text">pode alcançar</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Aumente os níveis para conseguir cada vez mais consultas
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative rounded-3xl p-8 bg-gradient-to-b from-helpude-purple to-helpude-purple-dark text-white shadow-2xl"
            >

              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-white/20">
                    <span className="text-white">
                      {plan.icon}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-white/70">
                    {plan.subtitle}
                  </span>
                </div>
                <h3 className="text-2xl font-display font-bold text-white">
                  {plan.name}
                </h3>
              </div>

              {/* Consultas Limit */}
              <div className="mb-4 rounded-2xl p-4 bg-white/10">
                <div className="text-xs font-medium uppercase tracking-wide mb-1 text-white/60">
                  Capacidade
                </div>
                <div className="text-lg font-display font-bold text-white">
                  {plan.consultasLimit}
                </div>
              </div>

              <p className="text-sm mb-6 text-white/80">
                {plan.description}
              </p>

              {/* Features */}
              <div className="text-xs font-semibold uppercase tracking-wide mb-3 text-white/60">
                Recursos inclusos
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-white/20">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-white/90">
                        {feature.text}
                      </span>
                      {feature.points && (
                        <span className="ml-1.5 text-xs font-medium px-1.5 py-0.5 rounded-full bg-white/15 text-white/80">
                          {feature.points}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Requirements */}
              {plan.requirements && plan.requirements.length > 0 && (
                <div className="rounded-2xl p-4 mb-6 bg-white/10">
                  <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wide text-white/60">
                    <FileText className="w-3.5 h-3.5" />
                    Requisitos para liberar
                  </div>
                  <ul className="space-y-2">
                    {plan.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-2 bg-white/50" />
                        {req.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                variant="heroOutline"
                className="w-full"
                size="lg"
              >
                {plan.name === 'Nível Básico' ? 'Começar Grátis' : plan.name === 'Nível Profissional' ? 'Evoluir para Profissional' : 'Falar com Consultor'}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
