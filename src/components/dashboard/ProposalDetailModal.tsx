import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Edit, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Proposal } from './ProposalPipeline';

interface ProposalDetailModalProps {
  proposal: Proposal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BankStatus {
  banco: string;
  status: 'ok' | 'pendente' | 'erro';
  origem: string;
  valorFinanciado: number;
  valorLiquido: number;
  valorParcela: number;
  prazo: number;
  taxaMensal: number;
  cetMensal: number;
  dataCriacao: string;
  linkContrato?: string;
}

// Mock data - in a real app this would come from the proposal or API
const getMockBankStatus = (proposal: Proposal): BankStatus => ({
  banco: 'uy3',
  status: proposal.status === 'aprovada' ? 'ok' : proposal.status === 'erro' ? 'pendente' : 'erro',
  origem: 'SITE',
  valorFinanciado: proposal.value || 1032.54,
  valorLiquido: (proposal.value || 1032.54) * 0.82,
  valorParcela: (proposal.value || 1032.54) / 7.6,
  prazo: 12,
  taxaMensal: 0.09,
  cetMensal: 0.09,
  dataCriacao: proposal.date,
  linkContrato: proposal.status === 'aprovada' ? 'https://exemplo.com/contrato' : undefined,
});

const ProposalDetailModal = ({ proposal, open, onOpenChange }: ProposalDetailModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [calculationType, setCalculationType] = useState<'liquido' | 'parcela'>('liquido');
  const [newValue, setNewValue] = useState('');
  const [pixKeyType, setPixKeyType] = useState<string>('');
  const [pixKey, setPixKey] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');

  if (!proposal) return null;

  const bankStatus = getMockBankStatus(proposal);

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status: BankStatus['status']) => {
    switch (status) {
      case 'ok':
        return <Badge className="bg-success hover:bg-success/90 text-white">ok</Badge>;
      case 'pendente':
        return <Badge className="bg-warning hover:bg-warning/90 text-white">pendente</Badge>;
      case 'erro':
        return <Badge className="bg-destructive hover:bg-destructive/90 text-white">erro</Badge>;
    }
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    setNewValue(calculationType === 'liquido' 
      ? bankStatus.valorLiquido.toFixed(2) 
      : bankStatus.valorParcela.toFixed(2)
    );
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewValue('');
    setPixKeyType('');
    setPixKey('');
  };

  const handleReenviar = () => {
    // Here you would implement the API call to update the proposal
    console.log('Reenviar proposta com:', { calculationType, newValue, pixKeyType, pixKey });
    setIsEditing(false);
    setNewValue('');
    setPixKeyType('');
    setPixKey('');
    onOpenChange(false);
  };

  const handleCalculationTypeChange = (value: 'liquido' | 'parcela') => {
    setCalculationType(value);
    setNewValue(value === 'liquido' 
      ? bankStatus.valorLiquido.toFixed(2) 
      : bankStatus.valorParcela.toFixed(2)
    );
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) {
        setIsEditing(false);
        setNewValue('');
        setPixKeyType('');
        setPixKey('');
      }
      onOpenChange(value);
    }}>
      <DialogContent className="glass-card border-border/50 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Detalhes da Proposta
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Dados para gatilhos de marketing */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">Dados para gatilhos de marketing</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Telefone</Label>
                <Input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="bg-background/50"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="bg-background/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Tipo Chave Pix</Label>
                <Select value={pixKeyType} onValueChange={setPixKeyType}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="telefone">Telefone</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="cpf">CPF</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                    <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Chave Pix</Label>
                <Input
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder={
                    pixKeyType === 'telefone' ? '(00) 00000-0000'
                    : pixKeyType === 'email' ? 'email@exemplo.com'
                    : pixKeyType === 'cpf' ? '000.000.000-00'
                    : pixKeyType === 'cnpj' ? '00.000.000/0001-00'
                    : 'Cole a chave aqui'
                  }
                  className="bg-background/50"
                />
              </div>
            </div>
            <Button className="gap-2 bg-primary hover:bg-primary/90 w-full" onClick={() => console.log('Ativar gatilho de marketing', { telefone, email, pixKeyType, pixKey })}>
              <Send className="h-4 w-4" />
              Ativar gatilho de marketing
            </Button>
          </div>

          <div className="border-t border-border/50 pt-4">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">Status dos Bancos</h4>
          </div>

          {/* Row 1: Banco, Status, Origem */}
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Banco</p>
              <p className="text-foreground font-medium">{bankStatus.banco}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              {getStatusBadge(bankStatus.status)}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Origem</p>
              <p className="text-foreground font-bold">{bankStatus.origem}</p>
            </div>
          </div>

          {/* Row 2: Valores */}
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Valor Financiado</p>
              <p className="text-primary font-bold">{formatCurrency(bankStatus.valorFinanciado)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Valor Líquido</p>
              <p className="text-primary font-bold">{formatCurrency(bankStatus.valorLiquido)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Valor Parcela</p>
              <p className="text-primary font-bold">{formatCurrency(bankStatus.valorParcela)}</p>
            </div>
          </div>

          {/* Edit Section */}
          <AnimatePresence>
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="glass-card rounded-xl p-4 space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-3 block">
                      Escolha o tipo de cálculo:
                    </Label>
                    <RadioGroup
                      value={calculationType}
                      onValueChange={(value) => handleCalculationTypeChange(value as 'liquido' | 'parcela')}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="liquido" id="liquido" />
                        <Label htmlFor="liquido" className="text-sm text-foreground cursor-pointer">
                          Valor Líquido
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="parcela" id="parcela" />
                        <Label htmlFor="parcela" className="text-sm text-foreground cursor-pointer">
                          Valor Parcela
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      {calculationType === 'liquido' ? 'Novo Valor Líquido:' : 'Novo Valor Parcela:'}
                    </Label>
                    <Input
                      type="text"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="0,00"
                      className="max-w-xs bg-background/50"
                    />
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Row 3: Prazo, Taxas */}
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Prazo</p>
              <p className="text-foreground font-medium">{bankStatus.prazo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Taxa Mensal</p>
              <p className="text-foreground font-medium">{bankStatus.taxaMensal}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">CET Mensal</p>
              <p className="text-foreground font-medium">{bankStatus.cetMensal}</p>
            </div>
          </div>

          {/* Row 4: Data e Link */}
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Data Criação</p>
              <p className="text-foreground font-medium">{bankStatus.dataCriacao}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground mb-1">Link do Contrato</p>
              {bankStatus.linkContrato ? (
                <a 
                  href={bankStatus.linkContrato} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 transition-colors"
                >
                  Abrir contrato
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <p className="text-muted-foreground">—</p>
              )}
            </div>
          </div>



          <div className="pt-4 border-t border-border/50">
            {!isEditing ? (
              <Button variant="outline" className="gap-2" onClick={handleStartEditing}>
                <Edit className="h-4 w-4" />
                Alterar Valores
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={handleReenviar}>
                  <Send className="h-4 w-4" />
                  Reenviar Proposta
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProposalDetailModal;
