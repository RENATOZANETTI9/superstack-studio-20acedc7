import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ConsultaForm from '@/components/dashboard/ConsultaForm';
import ProposalPipeline, { Proposal } from '@/components/dashboard/ProposalPipeline';
import ComboCardMini from '@/components/dashboard/ComboCardMini';
import FloatingChatButton from '@/components/FloatingChatButton';
import { toast } from 'sonner';
import { CreditCard, FileText, RefreshCw, Check, Clock, MessageSquare, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  active: boolean;
}

const Consultas = () => {
  const [selectedProduct, setSelectedProduct] = useState<string>('credito-clt');
  const [selectedCombo, setSelectedCombo] = useState<number>(1);
  const [consultasRestantes, setConsultasRestantes] = useState(50);
  const [gatilhosRestantes, setGatilhosRestantes] = useState(50);
  const [proposals, setProposals] = useState<Proposal[]>([]);

  const products: Product[] = [
    {
      id: 'credito-clt',
      title: 'Help CLT',
      description: '+43 milhões de público • Gatilhos de Marketing inclusos',
      icon: CreditCard,
      active: true,
    },
    {
      id: 'cdc-boleto',
      title: 'Help Boleto',
      description: '+25 milhões de público',
      icon: FileText,
      active: false,
    },
    {
      id: 'cartao-recorrente',
      title: 'Cartão Help',
      description: '+18 milhões de público',
      icon: RefreshCw,
      active: false,
    },
  ];

  const combos = [
    {
      title: 'Nível Básico',
      consultasLimit: '50 consultas/mês',
      active: true,
      locked: false,
    },
    {
      title: 'Nível Profissional',
      consultasLimit: '1.000 consultas/mês',
      active: true,
      locked: true,
    },
    {
      title: 'Nível Enterprise',
      consultasLimit: 'Ilimitado',
      active: true,
      locked: true,
    },
  ];

  const handleConsulta = (cpfs: string[]) => {
    const newProposals: Proposal[] = cpfs.map((cpf, index) => {
      const statuses: Array<'aprovada' | 'recusada' | 'erro'> = ['aprovada', 'recusada', 'erro'];
      const randomStatus = statuses[Math.floor(Math.random() * 100) % 3];
      const names = ['Cliente Teste', 'Usuário Demo', 'Pessoa Exemplo'];
      
      return {
        id: `${Date.now()}-${index}`,
        cpf: cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
        name: names[index % names.length],
        status: randomStatus,
        value: randomStatus === 'aprovada' ? Math.floor(Math.random() * 30000) + 5000 : undefined,
        date: new Date().toLocaleString('pt-BR'),
        marketingActions: randomStatus === 'aprovada' ? { rcs: false, email: false, call: false } : undefined,
      };
    });

    setProposals(prev => [...newProposals, ...prev]);
    setConsultasRestantes(prev => Math.max(0, prev - cpfs.length));
  };

  const handleMarketingAction = (proposalId: string, action: 'rcs' | 'email' | 'call') => {
    setProposals(prev => 
      prev.map(p => {
        if (p.id === proposalId) {
          const currentActions = p.marketingActions || { rcs: false, email: false, call: false };
          const newValue = !currentActions[action];
          
          // Só decrementa o contador quando está ativando uma ação (enviando)
          if (newValue) {
            const actionNames = { rcs: 'RCS', email: 'Email', call: 'Ligação IA' };
            toast.success(`${actionNames[action]} enviado para ${p.name}!`);
            setGatilhosRestantes(prev => Math.max(0, prev - 1));
          }
          
          return {
            ...p,
            marketingActions: {
              ...currentActions,
              [action]: newValue,
            },
          };
        }
        return p;
      })
    );
  };

  const selectedProductData = products.find(p => p.id === selectedProduct);

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Products Header */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex flex-wrap gap-3">
            {products.map((product) => {
              const Icon = product.icon;
              const isSelected = selectedProduct === product.id;
              
              return (
                <button
                  key={product.id}
                  onClick={() => {
                    if (product.active) {
                      setSelectedProduct(product.id);
                    } else {
                      toast.info(`${product.title} estará disponível em breve!`);
                    }
                  }}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300',
                    isSelected && product.active
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                      : 'border-border/50 bg-card/50 hover:border-primary/30',
                    !product.active && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    isSelected && product.active ? 'bg-primary/20' : 'bg-muted'
                  )}>
                    <Icon className={cn(
                      'h-5 w-5',
                      isSelected && product.active ? 'text-primary' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'font-semibold',
                        isSelected && product.active ? 'text-primary' : 'text-foreground'
                      )}>
                        {product.title}
                      </span>
                      {product.active ? (
                        <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-500">
                          <Check className="h-3 w-3" />
                          Ativo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Em breve
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{product.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{selectedProductData?.title}</h1>
          <p className="text-muted-foreground">
            Consulte o CPF do Paciente e visualize os resultados
          </p>
        </div>

        {/* Main Content - Form, Info and Combos */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left Side - Consulta Form (MAIOR DESTAQUE) */}
          <div className="lg:col-span-2 relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/10 rounded-3xl blur-md animate-pulse" />
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-2xl blur-sm" />
            <div className="relative">
              <ConsultaForm 
                onConsulta={handleConsulta}
                consultasRestantes={consultasRestantes}
                gatilhosRestantes={consultasRestantes}
              />
            </div>
          </div>

          {/* Middle - Consultation Info (COMPACTO) */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl p-4 h-full flex flex-col justify-center">
              <div className="text-center space-y-3">
                <div className="mx-auto w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                
                <div>
                  <h3 className="text-base font-bold text-foreground mb-1">
                    Consulta em Andamento
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Após inserir o CPF, a análise será automática.
                  </p>
                </div>

                <div className="border-t border-border/50 pt-3">
                  <p className="text-xs font-semibold text-foreground mb-2">
                    Se aprovado, enviamos automaticamente:
                  </p>
                  
                  <div className="flex justify-center gap-3">
                    <div className="flex flex-col items-center p-2 rounded-lg bg-muted/30">
                      <MessageSquare className="h-4 w-4 text-primary mb-1" />
                      <span className="text-xs font-medium text-foreground">RCS</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-muted/30">
                      <Mail className="h-4 w-4 text-primary mb-1" />
                      <span className="text-xs font-medium text-foreground">Email</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-muted/30">
                      <Phone className="h-4 w-4 text-primary mb-1" />
                      <span className="text-xs font-medium text-foreground">IA</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Combos */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Planos Disponíveis
              </h3>
              {combos.map((combo, index) => (
                <ComboCardMini
                  key={combo.title}
                  title={combo.title}
                  consultasLimit={combo.consultasLimit}
                  active={combo.active}
                  locked={combo.locked}
                  selected={selectedCombo === index + 1 && !combo.locked}
                  onSelect={() => {
                    if (!combo.locked) {
                      setSelectedCombo(index + 1);
                      if (index === 0) {
                        setConsultasRestantes(50);
                      }
                    } else {
                      toast.info('Este plano requer aprovação cadastral.');
                    }
                  }}
                />
              ))}
              
              {/* Info about selected combo */}
              <div className="mt-4 rounded-lg bg-primary/10 p-3">
                <p className="text-xs text-primary font-medium">
                  {combos[selectedCombo - 1].title} ativo
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {consultasRestantes} consultas restantes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline Section - Bottom */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="mb-4 text-xl font-bold text-foreground">
            Pipeline de Propostas
          </h3>
          {proposals.length > 0 ? (
            <ProposalPipeline 
              proposals={proposals}
              onMarketingAction={handleMarketingAction}
            />
          ) : (
            <div className="flex h-48 items-center justify-center text-center">
              <div>
                <p className="text-lg font-medium text-muted-foreground">
                  Nenhuma proposta no pipeline
                </p>
                <p className="text-sm text-muted-foreground">
                  As propostas aparecerão aqui após as consultas
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Floating Chat Button */}
        <FloatingChatButton />
      </motion.div>
    </DashboardLayout>
  );
};

export default Consultas;
