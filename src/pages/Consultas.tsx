import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ConsultaForm from '@/components/dashboard/ConsultaForm';
import ProposalPipeline, { Proposal } from '@/components/dashboard/ProposalPipeline';
import ComboCardMini from '@/components/dashboard/ComboCardMini';
import { toast } from 'sonner';

const Consultas = () => {
  const [selectedCombo, setSelectedCombo] = useState<number>(1);
  const [consultasRestantes, setConsultasRestantes] = useState(50);
  const [proposals, setProposals] = useState<Proposal[]>([]);

  const combos = [
    {
      title: 'Combo Básico',
      consultasLimit: '50 consultas/mês',
      active: true,
      locked: false,
    },
    {
      title: 'Combo Profissional',
      consultasLimit: '1.000 consultas/mês',
      active: true,
      locked: true,
    },
    {
      title: 'Combo Enterprise',
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

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Crédito CLT</h1>
          <p className="text-muted-foreground">
            Consulte o CPF do cliente e visualize os resultados
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Left Side - Consulta Form */}
          <div className="lg:col-span-1">
            <ConsultaForm 
              onConsulta={handleConsulta}
              consultasRestantes={consultasRestantes}
            />
          </div>

          {/* Middle - Results */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl p-6 h-full">
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
      </motion.div>
    </DashboardLayout>
  );
};

export default Consultas;
