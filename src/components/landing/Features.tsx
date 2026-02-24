import { motion } from 'framer-motion';
import { 
  CreditCard, 
  BarChart3, 
  Users, 
  Zap, 
  MessageSquare, 
  Shield 
} from 'lucide-react';

const features = [
  {
    icon: CreditCard,
    title: 'Consultas em Lote',
    description: 'Processe milhares de CPFs simultaneamente e obtenha análises de crédito em segundos.',
    color: 'from-helpude-purple to-helpude-purple-light',
  },
  {
    icon: BarChart3,
    title: 'Dashboard Analítico',
    description: 'Métricas em tempo real para acompanhar o desempenho da sua clínica.',
    color: 'from-helpude-teal to-helpude-teal-light',
  },
  {
    icon: Users,
    title: 'Pipeline de Vendas',
    description: 'Gerencie seus leads em um Kanban intuitivo do aprovado à conversão.',
    color: 'from-helpude-purple to-helpude-teal',
  },
  {
    icon: Zap,
    title: 'Automação de Marketing',
    description: 'Envio de marketing digital institucional de sua clínica para seus pacientes através de IA de ligação, SMS e email Mkt.',
    color: 'from-helpude-teal to-helpude-purple',
  },
  {
    icon: MessageSquare,
    title: 'Comunicação Integrada',
    description: 'Histórico completo de interações com cada paciente em um só lugar.',
    color: 'from-helpude-purple-light to-helpude-purple',
  },
  {
    icon: Shield,
    title: 'Segurança Total',
    description: 'Seus dados protegidos com criptografia de ponta a ponta e LGPD compliant.',
    color: 'from-helpude-teal-light to-helpude-teal',
  },
];

const Features = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
            Tudo que sua clínica{' '}
            <span className="gradient-text">precisa</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Uma plataforma completa para gerenciar crédito, clientes e campanhas de marketing.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
