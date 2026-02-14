import { useState, useMemo, useRef, useCallback } from 'react';
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
import { Search, Building2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Contratos = () => {
  const { contracts, loading, regenerateContract, fetchContracts } = useContracts();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [bankFilter, setBankFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const pullDistance = useRef(0);
  const [pullIndicator, setPullIndicator] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePullRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchContracts();
    toast.success('Dados atualizados!');
    setIsRefreshing(false);
    setPullIndicator(0);
  }, [fetchContracts]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    const scrollTop = containerRef.current?.scrollTop ?? window.scrollY;
    if (scrollTop <= 0) {
      pullStartY.current = e.touches[0].clientY;
    }
  }, [isMobile]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || pullStartY.current === 0 || isRefreshing) return;
    const scrollTop = containerRef.current?.scrollTop ?? window.scrollY;
    if (scrollTop > 0) return;
    const currentY = e.touches[0].clientY;
    pullDistance.current = Math.max(0, currentY - pullStartY.current);
    setPullIndicator(Math.min(pullDistance.current / 80, 1));
  }, [isMobile, isRefreshing]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobile) return;
    if (pullDistance.current > 80 && !isRefreshing) {
      handlePullRefresh();
    } else {
      setPullIndicator(0);
    }
    pullStartY.current = 0;
    pullDistance.current = 0;
  }, [isMobile, isRefreshing, handlePullRefresh]);

  const banks = useMemo(() => {
    const unique = [...new Set(contracts.map(c => c.bank_name))].sort();
    return unique;
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const searchTerm = search.trim();
      const cpfSearch = searchTerm.replace(/\D/g, '');
      const matchesSearch = !searchTerm || 
        c.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cpfSearch.length > 0 && c.cpf.includes(cpfSearch));
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
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull-to-refresh indicator */}
        {isMobile && (pullIndicator > 0 || isRefreshing) && (
          <div className="flex items-center justify-center py-3" style={{ opacity: isRefreshing ? 1 : pullIndicator }}>
            <Loader2 className={cn('h-5 w-5 text-primary', isRefreshing && 'animate-spin')} />
            <span className="ml-2 text-xs text-muted-foreground">
              {isRefreshing ? 'Atualizando...' : pullIndicator >= 1 ? 'Solte para atualizar' : 'Puxe para atualizar'}
            </span>
          </div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('space-y-4 sm:space-y-6 pb-20 sm:pb-6', isMobile && 'mt-14')}
        >
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Créditos Aprovados</h1>
          <p className="text-xs sm:text-base text-muted-foreground">
            Acompanhe o status dos créditos aprovados
          </p>
        </div>

        {/* Stats - horizontal scroll on mobile */}
        <div className={cn(
          isMobile 
            ? 'flex gap-2 overflow-x-auto scrollbar-hide -mx-2 px-2 pb-1' 
            : 'grid grid-cols-5 gap-3'
        )}>
          {[
            { label: 'Aguardando', value: stats.aguardando, color: 'text-primary' },
            { label: 'Pendências', value: stats.pendencias, color: 'text-warning' },
            { label: 'Pagos', value: stats.pagos, color: 'text-success' },
            { label: 'Expirados', value: stats.expirados, color: 'text-muted-foreground' },
            { label: 'Cancelados', value: stats.cancelados, color: 'text-destructive' },
          ].map((s) => (
            <div key={s.label} className={cn(
              'glass-card rounded-xl p-3 text-center',
              isMobile ? 'min-w-[100px] shrink-0' : 'sm:p-4'
            )}>
              {loading ? (
                <Skeleton className="h-7 w-10 mx-auto mb-1" />
              ) : (
                <p className={cn('text-xl sm:text-3xl font-bold', s.color)}>{s.value}</p>
              )}
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 whitespace-nowrap">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-6">
          {/* Header + Filters */}
          <div className="space-y-3 mb-3 sm:mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-xl font-bold text-foreground">
                Pipeline de Créditos
              </h3>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => { setSearch(''); setBankFilter('all'); }}
                >
                  <X className="h-3 w-3" /> Limpar
                </Button>
              )}
            </div>
            <div className={cn('flex gap-2', isMobile ? 'flex-col' : 'items-center')}>
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou CPF..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-xs w-full bg-background/50"
                />
              </div>
              <Select value={bankFilter} onValueChange={setBankFilter}>
                <SelectTrigger className="h-9 text-xs w-full sm:w-44 bg-background/50">
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
            </div>
          </div>

          {hasFilters && (
            <p className="text-xs text-muted-foreground mb-3">
              Mostrando {filteredContracts.length} de {contracts.length} créditos
            </p>
          )}

          {loading ? (
            <div className="flex gap-3 overflow-hidden">
              {[1,2,3].map(i => (
                <Skeleton key={i} className="h-48 w-64 shrink-0 rounded-xl" />
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
      </div>
    </DashboardLayout>
  );
};

export default Contratos;
