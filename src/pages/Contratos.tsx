import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ContractPipeline from '@/components/contratos/ContractPipeline';
import FloatingChatButton from '@/components/FloatingChatButton';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { mockContracts, type Contract } from '@/types/contracts';

const Contratos = () => {
  const [contracts, setContracts] = useState<Contract[]>(mockContracts);
  const isMobile = useIsMobile();

  const stats = {
    aguardando: contracts.filter((c) => c.contract_status === 'AGUARDANDO_ASSINATURA').length,
    pendencias: contracts.filter((c) => c.contract_status === 'PENDENCIAS_GERAIS').length,
    pagos: contracts.filter((c) => c.contract_status === 'PAGO').length,
    expirados: contracts.filter((c) => c.contract_status === 'EXPIRADO').length,
    cancelados: contracts.filter((c) => c.contract_status === 'CANCELADO').length,
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('space-y-4 sm:space-y-6', isMobile && 'mt-14')}
      >
        {/* Page Header */}
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
            Contratos
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Acompanhe o status de assinatura e pagamento dos contratos
          </p>
        </div>

        {/* Stats */}
        <div className={cn(
          'grid gap-3',
          isMobile ? 'grid-cols-2' : 'grid-cols-5'
        )}>
          {[
            { label: 'Aguardando', value: stats.aguardando, color: 'text-primary' },
            { label: 'Pendências', value: stats.pendencias, color: 'text-warning' },
            { label: 'Pagos', value: stats.pagos, color: 'text-success' },
            { label: 'Expirados', value: stats.expirados, color: 'text-muted-foreground' },
            { label: 'Cancelados', value: stats.cancelados, color: 'text-destructive' },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-xl p-3 sm:p-4 text-center">
              <p className={cn('text-2xl sm:text-3xl font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Pipeline */}
        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-bold text-foreground">
            Pipeline de Contratos
          </h3>
          <ContractPipeline
            contracts={contracts}
            onUpdateContracts={setContracts}
          />
        </div>

        <FloatingChatButton />
      </motion.div>
    </DashboardLayout>
  );
};

export default Contratos;
