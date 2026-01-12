import { motion } from 'framer-motion';
import { Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const plans = [
  {
    name: 'Nível 1',
    subtitle: 'Starter',
    price: 'R$ 197',
    period: '/mês',
    description: 'Ideal para clínicas iniciando com crédito',
    features: [
      '100 consultas/mês',
      'Dashboard básico',
      'Suporte por email',
      '1 usuário',
      'Relatórios mensais',
    ],
    popular: false,
    buttonVariant: 'outline' as const,
  },
  {
    name: 'Nível 2',
    subtitle: 'Professional',
    price: 'R$ 497',
    period: '/mês',
    description: 'Para clínicas em crescimento',
    features: [
      '500 consultas/mês',
      'Dashboard completo',
      'Pipeline Kanban',
      '5 usuários',
      'Automação básica',
      'Suporte prioritário',
      'API de integração',
    ],
    popular: true,
    buttonVariant: 'hero' as const,
  },
  {
    name: 'Nível 3',
    subtitle: 'Enterprise',
    price: 'R$ 997',
    period: '/mês',
    description: 'Para redes de clínicas',
    features: [
      'Consultas ilimitadas',
      'Todas as funcionalidades',
      'Usuários ilimitados',
      'Automação avançada',
      'WhatsApp integrado',
      'Gerente dedicado',
      'SLA garantido',
      'Treinamento incluso',
    ],
    popular: false,
    buttonVariant: 'secondary' as const,
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
            Planos que{' '}
            <span className="gradient-text">crescem com você</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha o nível ideal para sua clínica e evolua conforme sua necessidade.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-3xl p-8 ${
                plan.popular
                  ? 'bg-gradient-to-b from-helpude-purple to-helpude-purple-dark text-white scale-105 shadow-2xl'
                  : 'bg-card border border-border'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 bg-helpude-teal text-white text-sm font-medium px-4 py-1.5 rounded-full">
                    <Star className="w-4 h-4" />
                    Mais Popular
                  </div>
                </div>
              )}

              <div className="mb-6">
                <div className={`text-sm font-medium mb-1 ${plan.popular ? 'text-white/70' : 'text-muted-foreground'}`}>
                  {plan.subtitle}
                </div>
                <h3 className={`text-2xl font-display font-bold ${plan.popular ? 'text-white' : 'text-foreground'}`}>
                  {plan.name}
                </h3>
              </div>

              <div className="mb-6">
                <span className={`text-4xl font-display font-bold ${plan.popular ? 'text-white' : 'text-foreground'}`}>
                  {plan.price}
                </span>
                <span className={plan.popular ? 'text-white/70' : 'text-muted-foreground'}>
                  {plan.period}
                </span>
              </div>

              <p className={`text-sm mb-8 ${plan.popular ? 'text-white/80' : 'text-muted-foreground'}`}>
                {plan.description}
              </p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      plan.popular ? 'bg-white/20' : 'bg-primary/10'
                    }`}>
                      <Check className={`w-3 h-3 ${plan.popular ? 'text-white' : 'text-primary'}`} />
                    </div>
                    <span className={`text-sm ${plan.popular ? 'text-white/90' : 'text-foreground'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? 'heroOutline' : plan.buttonVariant}
                className="w-full"
                size="lg"
              >
                {plan.popular ? 'Começar Agora' : 'Selecionar Plano'}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
