import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ConsultaForm from '@/components/dashboard/ConsultaForm';
import ProposalPipeline, { Proposal } from '@/components/dashboard/ProposalPipeline';
import ComboCardMini from '@/components/dashboard/ComboCardMini';

import { toast } from 'sonner';
import { CreditCard, FileText, RefreshCw, Check, Clock, MessageSquare, Mail, Phone, Zap } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import PullToRefreshIndicator from '@/components/dashboard/PullToRefreshIndicator';

interface Product {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  active: boolean;
}

const Consultas = () => {
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<string>('credito-clt');
  const [selectedCombo, setSelectedCombo] = useState<number>(1);
  const [consultasRestantes, setConsultasRestantes] = useState(50);
  const [gatilhosRestantes, setGatilhosRestantes] = useState(50);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [autoGatilhos, setAutoGatilhos] = useState(true);
  const isMobile = useIsMobile();

  const handlePullRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
  }, []);

  const { containerRef, isRefreshing, pullIndicator, touchHandlers } = usePullToRefresh({
    onRefresh: handlePullRefresh,
    enabled: isMobile,
  });

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

  const handleConsulta = async (cpfs: string[]) => {
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
        marketingActions: randomStatus === 'aprovada' ? { sms: false, email: false, call: false } : undefined,
      };
    });

    if (user) {
      for (const proposal of newProposals) {
        if (proposal.status === 'aprovada') {
          const { error } = await supabase.from('contracts').insert({
            user_id: user.id,
            lead_id: proposal.id,
            patient_name: proposal.name,
            cpf: proposal.cpf.replace(/\D/g, ''),
            proposal_number: `PROP-${Date.now()}`,
            bank_name: 'Banco Help',
            proposal_status: 'Aprovada',
            amount_released: proposal.value || 0,
            installment_value: Math.round((proposal.value || 0) / 12),
            term_months: 12,
            signature_link: `https://assinatura.exemplo.com/${proposal.id}`,
            contract_status: 'AGUARDANDO_ASSINATURA',
          });
          if (error) {
            console.error('Erro ao criar contrato:', error);
          } else {
            toast.success(`Contrato criado para ${proposal.name} em Aguardando Assinatura`);
          }
        }
      }
    }

    setProposals(prev => [...newProposals, ...prev]);
    setConsultasRestantes(prev => Math.max(0, prev - cpfs.length));
  };

  const handleMarketingAction = (proposalId: string, action: 'sms' | 'email' | 'call') => {
    setProposals(prev => 
      prev.map(p => {
        if (p.id === proposalId) {
          const currentActions = p.marketingActions || { sms: false, email: false, call: false };
          const newValue = !currentActions[action];
          
          if (newValue) {
            const actionNames = { sms: 'SMS', email: 'Email', call: 'Ligação IA' };
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
      <div ref={containerRef} {...touchHandlers}>
        {isMobile && <PullToRefreshIndicator pullIndicator={pullIndicator} isRefreshing={isRefreshing} />}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("space-y-4 sm:space-y-6 pb-20 sm:pb-6", isMobile && "mt-14")}
        >
          {/* 1. Products Header */}
          <div className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4">
            <div className={cn(
              "flex gap-2 sm:gap-3",
              isMobile && "overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide"
            )}>
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
                      'flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl border px-3 py-2 sm:px-4 sm:py-3 transition-all duration-300 shrink-0',
                      isSelected && product.active
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                        : 'border-border/50 bg-card/50 hover:border-primary/30',
                      !product.active && 'opacity-60 cursor-not-allowed',
                      isMobile && product.active && 'flex-1',
                      isMobile && !product.active && 'text-xs px-2 py-1.5'
                    )}
                  >
                    <div className={cn(
                      'flex items-center justify-center rounded-lg',
                      isSelected && product.active ? 'bg-primary/20' : 'bg-muted',
                      isMobile && product.active ? 'h-9 w-9' : 'h-8 w-8 sm:h-10 sm:w-10',
                      isMobile && !product.active && 'h-7 w-7'
                    )}>
                      <Icon className={cn(
                        isSelected && product.active ? 'text-primary' : 'text-muted-foreground',
                        isMobile && product.active ? 'h-5 w-5' : 'h-4 w-4 sm:h-5 sm:w-5',
                        isMobile && !product.active && 'h-3.5 w-3.5'
                      )} />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className={cn(
                          'font-semibold whitespace-nowrap',
                          isSelected && product.active ? 'text-primary' : 'text-foreground',
                          isMobile && product.active ? 'text-sm' : 'text-sm sm:text-base',
                          isMobile && !product.active && 'text-[11px]'
                        )}>
                          {product.title}
                        </span>
                        {product.active ? (
                          <span className="flex items-center gap-0.5 sm:gap-1 rounded-full bg-green-500/20 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs text-green-500">
                            <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            <span className="hidden sm:inline">Ativo</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 sm:gap-1 rounded-full bg-muted px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs text-muted-foreground">
                            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            <span className="hidden sm:inline">Em breve</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{product.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Page Header - Desktop only (on mobile it's shown before the form) */}
          {!isMobile && (
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{selectedProductData?.title}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Consulte o CPF do Paciente e visualize os resultados
              </p>
            </div>
          )}

          {/* 2. Níveis Disponíveis - Before form on mobile */}
          {isMobile && (
            <div className="glass-card rounded-xl p-3">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Níveis Disponíveis
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                {combos.map((combo, index) => (
                  <div key={combo.title} className="shrink-0 w-36">
                    <ComboCardMini
                      title={combo.title}
                      consultasLimit={combo.consultasLimit}
                      active={combo.active}
                      locked={combo.locked}
                      selected={selectedCombo === index + 1 && !combo.locked}
                      onSelect={() => {
                        if (!combo.locked) {
                          setSelectedCombo(index + 1);
                          if (index === 0) setConsultasRestantes(50);
                        } else {
                          toast.info('Este plano requer aprovação cadastral.');
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-lg bg-primary/10 p-2">
                <p className="text-xs text-primary font-medium">{combos[selectedCombo - 1].title} ativo</p>
                <p className="text-xs text-muted-foreground mt-0.5">{consultasRestantes} consultas restantes</p>
              </div>
            </div>
          )}

          {/* Mobile Page Header - before form */}
          {isMobile && (
            <div>
              <h1 className="text-xl font-bold text-foreground">{selectedProductData?.title}</h1>
              <p className="text-sm text-muted-foreground">
                Consulte o CPF do Paciente e visualize os resultados
              </p>
            </div>
          )}

          {/* 3. Main Content grid */}
          <div className={cn(
            "grid gap-4 sm:gap-6",
            isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-5"
          )}>
            {/* Consulta Form */}
            <div className={cn(isMobile ? "" : "lg:col-span-2 relative")}>
              {!isMobile && (
                <>
                  <div className="absolute -inset-2 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/10 rounded-3xl blur-md animate-pulse" />
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-2xl blur-sm" />
                </>
              )}
              <div className="relative">
                <ConsultaForm 
                  onConsulta={handleConsulta}
                  consultasRestantes={consultasRestantes}
                  gatilhosRestantes={consultasRestantes}
                />
              </div>
            </div>

            {/* Middle Info - Desktop only */}
            {!isMobile && (
              <div className="lg:col-span-2">
                <div className="glass-card rounded-2xl p-4 h-full flex flex-col justify-center">
                  <div className="text-center space-y-3">
                    <div className="mx-auto w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground mb-1">Consulta em Andamento</h3>
                      <p className="text-xs text-muted-foreground">Após inserir o CPF, a análise será automática.</p>
                    </div>
                    <div className="border-t border-border/50 pt-3">
                      <p className="text-xs font-semibold text-foreground mb-2">Se aprovado, enviamos automaticamente:</p>
                      <div className="flex justify-center gap-3 mb-4">
                        <div className={cn("flex flex-col items-center p-2 rounded-lg transition-all duration-300", autoGatilhos ? "bg-primary/15" : "bg-muted/30 opacity-50")}>
                          <MessageSquare className={cn("h-4 w-4 mb-1 transition-colors", autoGatilhos ? "text-primary" : "text-muted-foreground")} />
                          <span className="text-xs font-medium text-foreground">SMS</span>
                        </div>
                        <div className={cn("flex flex-col items-center p-2 rounded-lg transition-all duration-300", autoGatilhos ? "bg-primary/15" : "bg-muted/30 opacity-50")}>
                          <Mail className={cn("h-4 w-4 mb-1 transition-colors", autoGatilhos ? "text-primary" : "text-muted-foreground")} />
                          <span className="text-xs font-medium text-foreground">Email</span>
                        </div>
                        <div className={cn("flex flex-col items-center p-2 rounded-lg transition-all duration-300", autoGatilhos ? "bg-primary/15" : "bg-muted/30 opacity-50")}>
                          <Phone className={cn("h-4 w-4 mb-1 transition-colors", autoGatilhos ? "text-primary" : "text-muted-foreground")} />
                          <span className="text-xs font-medium text-foreground">IA</span>
                        </div>
                      </div>

                      {/* Toggle automático */}
                      <div className={cn(
                        "flex items-center justify-between rounded-xl p-3 transition-all duration-300 border",
                        autoGatilhos 
                          ? "bg-primary/10 border-primary/30" 
                          : "bg-muted/20 border-border/50"
                      )}>
                        <div className="flex items-center gap-2">
                          <Zap className={cn("h-4 w-4 transition-colors", autoGatilhos ? "text-primary" : "text-muted-foreground")} />
                          <Label htmlFor="auto-gatilhos" className="text-xs font-medium cursor-pointer select-none">
                            Gatilhos automáticos
                          </Label>
                        </div>
                        <Switch
                          id="auto-gatilhos"
                          checked={autoGatilhos}
                          onCheckedChange={(checked) => {
                            setAutoGatilhos(checked);
                            toast.success(checked ? '⚡ Gatilhos automáticos ativados!' : '⏸️ Gatilhos automáticos desativados');
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Combos - Desktop only */}
            {!isMobile && (
              <div className="lg:col-span-1">
                <div className="glass-card rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Níveis Disponíveis</h3>
                  <div className="space-y-3">
                    {combos.map((combo, index) => (
                      <div key={combo.title}>
                        <ComboCardMini
                          title={combo.title}
                          consultasLimit={combo.consultasLimit}
                          active={combo.active}
                          locked={combo.locked}
                          selected={selectedCombo === index + 1 && !combo.locked}
                          onSelect={() => {
                            if (!combo.locked) {
                              setSelectedCombo(index + 1);
                              if (index === 0) setConsultasRestantes(50);
                            } else {
                              toast.info('Este plano requer aprovação cadastral.');
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-lg bg-primary/10 p-3">
                    <p className="text-xs text-primary font-medium">{combos[selectedCombo - 1].title} ativo</p>
                    <p className="text-xs text-muted-foreground mt-1">{consultasRestantes} consultas restantes</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Pipeline Section */}
          <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-bold text-foreground">
              Pipeline de Propostas
            </h3>
            {proposals.length > 0 ? (
              <ProposalPipeline 
                proposals={proposals}
                onMarketingAction={handleMarketingAction}
              />
            ) : (
              <div className="flex h-32 sm:h-48 items-center justify-center text-center">
                <div>
                  <p className="text-base sm:text-lg font-medium text-muted-foreground">
                    Nenhuma proposta no pipeline
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    As propostas aparecerão aqui após as consultas
                  </p>
                </div>
              </div>
            )}
          </div>

        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Consultas;
