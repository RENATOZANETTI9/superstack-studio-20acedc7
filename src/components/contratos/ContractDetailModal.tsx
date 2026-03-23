import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExternalLink, Copy, AlertTriangle, RefreshCw, Plus, Check, Calendar, Clock, X, Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import type { Contract, HistoryInteractionType, HistoryInteractionStatus } from '@/types/contracts';
import { useContractHistory } from '@/hooks/useContracts';
import { useAuth } from '@/contexts/AuthContext';

interface ContractDetailModalProps {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegenerate: (contractId: string) => void;
}

const interactionTypes: HistoryInteractionType[] = ['Ligação', 'WhatsApp', 'E-mail', 'Mensagem', 'Outro'];
const interactionStatuses: HistoryInteractionStatus[] = ['Falou com paciente', 'Não atendeu', 'Pediu para retornar', 'Número incorreto', 'Outro'];

const ContractDetailModal = ({ contract, open, onOpenChange, onRegenerate }: ContractDetailModalProps) => {
  const { user } = useAuth();
  const { history, scheduledReturns, addHistoryItem, addScheduledReturn, completeReturn } = useContractHistory(contract?.id);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newType, setNewType] = useState<HistoryInteractionType>('Ligação');
  const [newStatus, setNewStatus] = useState<HistoryInteractionStatus>('Falou com paciente');
  const [newObservation, setNewObservation] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [marketingTelefone, setMarketingTelefone] = useState('');
  const [marketingEmail, setMarketingEmail] = useState('');
  const [marketingActivated, setMarketingActivated] = useState(false);

  if (!contract) return null;

  const formatCurrency = (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const formatDate = (dateStr?: string) => { if (!dateStr) return '—'; return new Date(dateStr).toLocaleString('pt-BR'); };
  const getExpiredAt = () => new Date(new Date(contract.link_generated_at).getTime() + 72 * 3600000).toISOString();

  const activeReturn = scheduledReturns.find((r) => r.contract_id === contract.id && !r.completed);

  const copyLink = () => { navigator.clipboard.writeText(contract.signature_link); toast.success('Link copiado!'); };

  const handleAddHistory = async () => {
    const userName = user?.email?.split('@')[0] || 'Você';
    const success = await addHistoryItem({
      contract_id: contract.id,
      date: new Date().toISOString(),
      user_name: userName,
      type: newType,
      status: newStatus,
      observation: newObservation,
    });

    if (success && newStatus === 'Pediu para retornar' && returnDate && returnTime) {
      await addScheduledReturn({ contract_id: contract.id, date: returnDate, time: returnTime });
    }

    if (success) {
      setShowAddForm(false);
      setNewType('Ligação');
      setNewStatus('Falou com paciente');
      setNewObservation('');
      setReturnDate('');
      setReturnTime('');
      toast.success('Registro adicionado ao histórico.');
    }
  };

  const handleMarkReturnDone = async (returnId: string) => {
    const userName = user?.email?.split('@')[0] || 'Você';
    await completeReturn(returnId);
    await addHistoryItem({
      contract_id: contract.id,
      date: new Date().toISOString(),
      user_name: userName,
      type: 'Ligação',
      status: 'Falou com paciente',
      observation: 'Retorno agendado realizado.',
    });
    toast.success('Retorno marcado como realizado.');
  };

  const handleCancelReturn = async (returnId: string) => {
    const userName = user?.email?.split('@')[0] || 'Você';
    await completeReturn(returnId);
    await addHistoryItem({
      contract_id: contract.id,
      date: new Date().toISOString(),
      user_name: userName,
      type: 'Outro',
      status: 'Outro',
      observation: 'Retorno agendado cancelado.',
    });
    toast.info('Retorno cancelado.');
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { className: string; label: string }> = {
      AGUARDANDO_ASSINATURA: { className: 'bg-primary/20 text-primary border-primary/30', label: 'Aguardando Assinatura' },
      PENDENCIAS_GERAIS: { className: 'bg-warning/20 text-warning border-warning/30', label: 'Pendências' },
      PAGO: { className: 'bg-success/20 text-success border-success/30', label: 'Pago' },
      EXPIRADO: { className: 'bg-muted text-muted-foreground border-border', label: 'Expirado' },
      CANCELADO: { className: 'bg-destructive/20 text-destructive border-destructive/30', label: 'Cancelado' },
    };
    const cfg = map[status] || map.AGUARDANDO_ASSINATURA;
    return <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/50 max-w-3xl max-h-[90vh] p-0 overflow-hidden w-[95vw] sm:w-full">
        <DialogHeader className="p-4 sm:p-6 pb-0">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">Detalhes do Crédito</DialogTitle>
            {getStatusBadge(contract.contract_status)}
          </div>
        </DialogHeader>

        <Tabs defaultValue="dados" className="flex-1">
          <TabsList className="mx-4 sm:mx-6">
            <TabsTrigger value="dados" className="text-xs sm:text-sm">Dados</TabsTrigger>
            <TabsTrigger value="auditoria" className="text-xs sm:text-sm">Auditoria</TabsTrigger>
            <TabsTrigger value="historico" className="text-xs sm:text-sm">Histórico</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] sm:h-[65vh]">
            <TabsContent value="dados" className="p-4 sm:p-6 pt-4 space-y-4 m-0">
              {contract.contract_status === 'EXPIRADO' && (
                <div className="rounded-lg border border-warning/50 bg-warning/10 p-3 sm:p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                    <div>
                       <p className="text-sm font-medium text-foreground">Este crédito expirou por não ter sido assinado dentro do prazo de 72 horas.</p>
                       <p className="text-xs text-muted-foreground mt-1">Clique em "Regenerar crédito" para gerar um novo link de assinatura.</p>
                    </div>
                  </div>
                  <Button onClick={() => onRegenerate(contract.id)} className="gap-2 bg-warning hover:bg-warning/90 text-warning-foreground" size="sm">
                    <RefreshCw className="h-4 w-4" /> Regenerar Crédito
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div><p className="text-xs text-muted-foreground mb-1">Paciente</p><p className="text-sm font-medium text-foreground">{contract.patient_name}</p></div>
                <div><p className="text-xs text-muted-foreground mb-1">CPF</p><p className="text-sm font-medium text-foreground">{contract.cpf}</p></div>
                <div><p className="text-xs text-muted-foreground mb-1">Nº Proposta</p><p className="text-sm font-medium text-foreground">{contract.proposal_number}</p></div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div><p className="text-xs text-muted-foreground mb-1">Banco</p><p className="text-sm font-medium text-foreground">{contract.bank_name}</p></div>
                <div><p className="text-xs text-muted-foreground mb-1">Status Proposta</p><p className="text-sm font-medium text-foreground">{contract.proposal_status}</p></div>
                <div><p className="text-xs text-muted-foreground mb-1">Prazo</p><p className="text-sm font-medium text-foreground">{contract.term_months}x</p></div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div><p className="text-xs text-muted-foreground mb-1">Valor Liberado</p><p className="text-sm font-bold text-primary">{formatCurrency(contract.amount_released)}</p></div>
                <div><p className="text-xs text-muted-foreground mb-1">Valor Parcela</p><p className="text-sm font-bold text-primary">{formatCurrency(contract.installment_value)}</p></div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Link de Assinatura</p>
                <div className="flex items-center gap-2">
                  <a href={contract.signature_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 transition-colors truncate">
                    Abrir link <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={copyLink}><Copy className="h-3.5 w-3.5" /></Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Gerado em: {formatDate(contract.link_generated_at)}</p>
              </div>

              {/* Dados para gatilhos de marketing */}
              <div className="border-t border-border/50 pt-4 space-y-4">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">Dados para gatilhos de marketing</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Telefone</Label>
                    <Input
                      type="tel"
                      value={marketingTelefone}
                      onChange={(e) => setMarketingTelefone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="bg-background/50"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Email</Label>
                    <Input
                      type="email"
                      value={marketingEmail}
                      onChange={(e) => setMarketingEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                      className="bg-background/50"
                    />
                  </div>
                </div>
                {marketingActivated ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/30">
                    <Check className="h-5 w-5 text-success" />
                    <span className="text-sm font-semibold text-success">Gatilhos de marketing ativados com sucesso!</span>
                  </div>
                ) : (
                  <Button className="gap-2 bg-primary hover:bg-primary/90 w-full" onClick={async () => {
                    if (!user) return;
                    // Insert history records for SMS, Email, and Call triggers
                    const items = [
                      { type: 'Mensagem', status: 'Enviado' },
                      { type: 'E-mail', status: 'Enviado' },
                      { type: 'Ligação', status: 'Enviado' },
                    ];
                    for (const item of items) {
                      await addHistoryItem({
                        contract_id: contract.id,
                        date: new Date().toISOString(),
                        user_name: user.email || 'Usuário',
                        type: item.type,
                        status: item.status,
                        observation: `Gatilho de marketing ativado. Tel: ${marketingTelefone || '—'}, Email: ${marketingEmail || '—'}`,
                      });
                    }
                    setMarketingActivated(true);
                    toast.success('Gatilhos de marketing ativados!');
                  }}>
                    <Send className="h-4 w-4" />
                    Ativar gatilho de marketing
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="auditoria" className="p-4 sm:p-6 pt-4 space-y-3 m-0">
              {[
                { label: 'Criado em', value: contract.created_at },
                { label: 'Aprovado em', value: contract.approved_at },
                { label: 'Link gerado em', value: contract.link_generated_at },
                { label: 'Assinatura iniciada em', value: contract.signature_started_at },
                { label: 'Assinado em', value: contract.signed_at },
                { label: 'Pago em', value: contract.paid_at },
                { label: 'Expira em (72h)', value: getExpiredAt() },
                { label: 'Cancelado em', value: contract.cancelled_at },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs font-medium text-foreground">{formatDate(value)}</span>
                </div>
              ))}
              {contract.pending_reason && (
                <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-3">
                  <p className="text-xs font-medium text-warning mb-1">Motivo da Pendência</p>
                  <p className="text-xs text-foreground">{contract.pending_reason}</p>
                </div>
              )}
              {contract.cancel_reason && (
                <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-xs font-medium text-destructive mb-1">Motivo do Cancelamento</p>
                  <p className="text-xs text-foreground">{contract.cancel_reason}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="historico" className="p-4 sm:p-6 pt-4 space-y-4 m-0">
              {activeReturn && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium text-foreground">Próximo retorno agendado: {activeReturn.date} às {activeReturn.time}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default" className="text-xs h-7 gap-1" onClick={() => handleMarkReturnDone(activeReturn.id)}>
                      <Check className="h-3 w-3" /> Realizado
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-destructive hover:text-destructive" onClick={() => handleCancelReturn(activeReturn.id)}>
                      <X className="h-3 w-3" /> Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {!showAddForm && (
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4" /> Adicionar Registro
                </Button>
              )}

              <AnimatePresence>
                {showAddForm && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="rounded-lg border border-border bg-card p-3 sm:p-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Tipo</Label>
                          <Select value={newType} onValueChange={(v) => setNewType(v as HistoryInteractionType)}>
                            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>{interactionTypes.map((t) => (<SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>))}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Status</Label>
                          <Select value={newStatus} onValueChange={(v) => setNewStatus(v as HistoryInteractionStatus)}>
                            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>{interactionStatuses.map((s) => (<SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>))}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Observação</Label>
                        <Textarea value={newObservation} onChange={(e) => setNewObservation(e.target.value)} placeholder="Descreva o atendimento..." className="mt-1 text-xs min-h-[60px]" />
                      </div>
                      <AnimatePresence>
                        {newStatus === 'Pediu para retornar' && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                              <p className="text-xs font-medium text-primary flex items-center gap-1"><Clock className="h-3 w-3" /> Agendar Retorno</p>
                              <div className="grid grid-cols-2 gap-2">
                                <div><Label className="text-xs">Data</Label><Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="h-8 text-xs mt-1" /></div>
                                <div><Label className="text-xs">Hora</Label><Input type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} className="h-8 text-xs mt-1" /></div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" className="text-xs h-7" onClick={handleAddHistory}>Salvar</Button>
                        <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setShowAddForm(false)}>Cancelar</Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                {history.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">Nenhum registro de atendimento.</p>
                )}
                {history.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.type}</Badge>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{item.status}</Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{formatDate(item.date)}</span>
                    </div>
                    <p className="text-xs text-foreground">{item.observation}</p>
                    <p className="text-[10px] text-muted-foreground">Por: {item.user_name}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ContractDetailModal;
