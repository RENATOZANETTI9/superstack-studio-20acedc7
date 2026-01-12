import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardStats from '@/components/dashboard/DashboardStats';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import ProposalPipeline, { Proposal } from '@/components/dashboard/ProposalPipeline';
import ProductCard from '@/components/dashboard/ProductCard';
import { toast } from 'sonner';

const DashboardHome = () => {
  const navigate = useNavigate();
  
  const [stats] = useState({
    consultas: 1234,
    aprovadas: 856,
    recusadas: 298,
    rcsEnviados: 2451,
    emailsEnviados: 1872,
    ligacoesRealizadas: 943,
  });

  const [proposals, setProposals] = useState<Proposal[]>([
    {
      id: '1',
      cpf: '123.456.789-01',
      name: 'João Silva',
      status: 'aprovada',
      value: 15000,
      date: '12/01/2026 14:30',
      marketingActions: { rcs: true, email: false, call: false },
    },
    {
      id: '2',
      cpf: '987.654.321-09',
      name: 'Maria Santos',
      status: 'aprovada',
      value: 8500,
      date: '12/01/2026 13:45',
      marketingActions: { rcs: true, email: true, call: false },
    },
    {
      id: '3',
      cpf: '111.222.333-44',
      name: 'Pedro Oliveira',
      status: 'recusada',
      date: '12/01/2026 12:00',
    },
    {
      id: '4',
      cpf: '555.666.777-88',
      name: 'Ana Costa',
      status: 'erro',
      date: '12/01/2026 11:30',
    },
    {
      id: '5',
      cpf: '999.888.777-66',
      name: 'Carlos Ferreira',
      status: 'aprovada',
      value: 22000,
      date: '12/01/2026 10:15',
      marketingActions: { rcs: true, email: true, call: true },
    },
  ]);

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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema e resultados das suas consultas
          </p>
        </div>

        {/* Stats */}
        <DashboardStats stats={stats} />

        {/* Charts Section */}
        <div>
          <h2 className="mb-4 text-xl font-bold text-foreground">Análise de Desempenho</h2>
          <DashboardCharts />
        </div>

        {/* Products Section */}
        <div>
          <h2 className="mb-4 text-xl font-bold text-foreground">Produtos Disponíveis</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <ProductCard
                key={product.title}
                {...product}
                onClick={() => navigate('/dashboard/consultas')}
              />
            ))}
          </div>
        </div>

        {/* Pipeline Section */}
        <div>
          <h2 className="mb-4 text-xl font-bold text-foreground">Pipeline de Propostas</h2>
          <ProposalPipeline 
            proposals={proposals} 
            onMarketingAction={handleMarketingAction}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardHome;
