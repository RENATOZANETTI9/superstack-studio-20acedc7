import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  valorFinanciado: proposal.value || 3510.78,
  valorLiquido: (proposal.value || 3510.78) * 0.82,
  valorParcela: (proposal.value || 3510.78) / 7.5,
  prazo: 12,
  taxaMensal: 0.09,
  cetMensal: 0.09,
  dataCriacao: proposal.date,
  linkContrato: proposal.status === 'aprovada' ? 'https://exemplo.com/contrato' : undefined,
});

const ProposalDetailModal = ({ proposal, open, onOpenChange }: ProposalDetailModalProps) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/50 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Status dos Bancos
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-6">
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

          {/* Alterar Valores Button */}
          <div className="pt-4 border-t border-border/50">
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Alterar Valores
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProposalDetailModal;
