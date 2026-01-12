import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ProductCard from '@/components/dashboard/ProductCard';
import ComboCard from '@/components/dashboard/ComboCard';
import ConsultaForm from '@/components/dashboard/ConsultaForm';
import ProposalPipeline, { Proposal } from '@/components/dashboard/ProposalPipeline';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

type ViewState = 'products' | 'combos' | 'consulta';

const Consultas = () => {
  const [view, setView] = useState<ViewState>('products');
  const [selectedCombo, setSelectedCombo] = useState<number>(1);
  const [consultasRestantes, setConsultasRestantes] = useState(50);
  const [proposals, setProposals] = useState<Proposal[]>([]);

  const products = [
    {
      title: 'Crédito CLT',
      description: 'Análise de crédito para trabalhadores com carteira assinada. Consulta completa com score e limite sugerido.',
      audience: '+43 milhões',
      active: true,
    },
    {
      title: 'CDC Boleto',
      description: 'Crédito direto ao consumidor com pagamento via boleto bancário.',
      audience: '+25 milhões',
      active: false,
    },
    {
      title: 'Cartão Recorrente',
      description: 'Análise para cartões de crédito com fatura recorrente.',
      audience: '+18 milhões',
      active: false,
    },
  ];

  const combos = [
    {
      title: 'Combo Básico',
      consultasLimit: '50 consultas/mês',
      features: [
        'Consultas individuais',
        'Consultas em lote (CSV)',
        'Pipeline de propostas',
        'Gatilhos de marketing básicos',
      ],
      active: true,
      locked: false,
    },
    {
      title: 'Combo Profissional',
      consultasLimit: '1.000 consultas/mês',
      features: [
        'Tudo do Combo Básico',
        'Prioridade no processamento',
        'Relatórios avançados',
        'API de integração',
      ],
      requirements: [
        'Aprovação cadastral',
        'Contrato social',
        'Documentação da empresa',
      ],
      active: true,
      locked: true,
    },
    {
      title: 'Combo Enterprise',
      consultasLimit: 'Ilimitado',
      features: [
        'Tudo do Combo Profissional',
        'Suporte dedicado 24/7',
        'Customização de regras',
        'Webhooks em tempo real',
      ],
      requirements: [
        'Toda documentação do Combo Profissional',
        'Análise de histórico dos últimos 90 dias',
        'Aprovação cadastral especial',
      ],
      active: true,
      locked: true,
    },
  ];

  const handleConsulta = (cpfs: string[]) => {
    // Simular resultados
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
          
          if (newValue) {
            const actionNames = { rcs: 'RCS', email: 'Email', call: 'Ligação IA' };
            toast.success(`${actionNames[action]} enviado para ${p.name}!`);
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

  const renderContent = () => {
    switch (view) {
      case 'products':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-3xl font-bold text-foreground">Consultas</h1>
              <p className="text-muted-foreground">
                Selecione um produto para iniciar suas consultas de análise de crédito
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.title}
                  {...product}
                  onClick={() => setView('combos')}
                />
              ))}
            </div>
          </motion.div>
        );

      case 'combos':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setView('products')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Crédito CLT</h1>
                <p className="text-muted-foreground">
                  Escolha o combo ideal para suas necessidades
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {combos.map((combo, index) => (
                <ComboCard
                  key={combo.title}
                  {...combo}
                  selected={selectedCombo === index + 1 && !combo.locked}
                  onSelect={() => {
                    if (!combo.locked) {
                      setSelectedCombo(index + 1);
                      setView('consulta');
                    }
                  }}
                />
              ))}
            </div>
          </motion.div>
        );

      case 'consulta':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setView('combos')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Crédito CLT - {combos[selectedCombo - 1].title}
                </h1>
                <p className="text-muted-foreground">
                  Realize consultas individuais ou em lote
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <ConsultaForm 
                  onConsulta={handleConsulta}
                  consultasRestantes={consultasRestantes}
                />
              </div>
              <div className="lg:col-span-2">
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="mb-4 text-xl font-bold text-foreground">
                    Resultados das Consultas
                  </h3>
                  {proposals.length > 0 ? (
                    <ProposalPipeline 
                      proposals={proposals}
                      onMarketingAction={handleMarketingAction}
                    />
                  ) : (
                    <div className="flex h-64 items-center justify-center text-center">
                      <div>
                        <p className="text-lg font-medium text-muted-foreground">
                          Nenhuma consulta realizada ainda
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Faça sua primeira consulta para ver os resultados aqui
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <DashboardLayout>
      {renderContent()}
    </DashboardLayout>
  );
};

export default Consultas;
