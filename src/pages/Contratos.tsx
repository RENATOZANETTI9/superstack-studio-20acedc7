import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ContractPipeline from '@/components/contratos/ContractPipeline';
import FloatingChatButton from '@/components/FloatingChatButton';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useContracts } from '@/hooks/useContracts';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Building2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Contratos = () => {
  const { contracts, loading, regenerateContract, fetchContracts } = useContracts();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [bankFilter, setBankFilter] = useState('all');

  const banks = useMemo(() => {
    const unique = [...new Set(contracts.map(c => c.bank_name))].sort();
    return unique;
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const matchesSearch = !search || 
        c.patient_name.toLowerCase().includes(search.toLowerCase()) ||
        c.cpf.includes(search.replace(/\D/g, ''));
      const matchesBank = bankFilter === 'all' || c.bank_name === bankFilter;
      return matchesSearch && matchesBank;
    });
  }, [contracts, search, bankFilter]);

  const hasFilters = search || bankFilter !== 'all';

  const stats = {
    aguardando: filteredContracts.filter((c) => c.contract_status === 'AGUARDANDO_ASSINATURA').length,
    pendencias: filteredContracts.filter((c) => c.contract_status === 'PENDENCIAS_GERAIS').length,
    pagos: filteredContracts.filter((c) => c.contract_status === 'PAGO').length,
    expirados: filteredContracts.filter((c) => c.contract_status === 'EXPIRADO').length,
    cancelados: filteredContracts.filter((c) => c.contract_status === 'CANCELADO').length,
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('space-y-4 sm:space-y-6', isMobile && 'mt-14')}
      >
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Contratos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Acompanhe o status de assinatura e pagamento dos contratos
          </p>
        </div>

        <div className={cn('grid gap-3', isMobile ? 'grid-cols-2' : 'grid-cols-5')}>
          {[
            { label: 'Aguardando', value: stats.aguardando, color: 'text-primary' },
            { label: 'Pendências', value: stats.pendencias, color: 'text-warning' },
            { label: 'Pagos', value: stats.pagos, color: 'text-success' },
            { label: 'Expirados', value: stats.expirados, color: 'text-muted-foreground' },
            { label: 'Cancelados', value: stats.cancelados, color: 'text-destructive' },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-xl p-3 sm:p-4 text-center">
              {loading ? (
                <Skeleton className="h-8 w-12 mx-auto mb-1" />
              ) : (
                <p className={cn('text-2xl sm:text-3xl font-bold', s.color)}>{s.value}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <div className={cn(
            'flex items-center justify-between mb-3 sm:mb-4 gap-3',
            isMobile && 'flex-col items-stretch'
          )}>
            <h3 className="text-lg sm:text-xl font-bold text-foreground shrink-0">
              Pipeline de Contratos
            </h3>
            <div className={cn('flex gap-2', isMobile ? 'flex-col' : 'items-center')}>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou CPF..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs w-full sm:w-56 bg-background/50"
                />
              </div>
              <div className="flex gap-2 items-center">
                <Select value={bankFilter} onValueChange={setBankFilter}>
                  <SelectTrigger className="h-8 text-xs w-full sm:w-40 bg-background/50">
                    <Building2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Banco" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Todos os bancos</SelectItem>
                    {banks.map(b => (
                      <SelectItem key={b} value={b} className="text-xs">{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => { setSearch(''); setBankFilter('all'); }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {hasFilters && (
            <p className="text-xs text-muted-foreground mb-3">
              Mostrando {filteredContracts.length} de {contracts.length} contratos
            </p>
          )}

          {loading ? (
            <div className="flex gap-4">
              {[1,2,3,4,5].map(i => (
                <Skeleton key={i} className="h-64 w-64 shrink-0 rounded-xl" />
              ))}
            </div>
          ) : (
            <ContractPipeline
              contracts={filteredContracts}
              onRegenerate={regenerateContract}
              onRefresh={fetchContracts}
            />
          )}
        </div>

        <FloatingChatButton />
      </motion.div>
    </DashboardLayout>
  );
};

export default Contratos;
