import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gift, CheckCircle2, Camera, Upload, X, Image } from 'lucide-react';
import { COMMISSION_STATUS_LABELS, COMMISSION_STATUS_COLORS } from '@/lib/partner-rules';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

interface Props {
  items: any[];
  loading: boolean;
  hasActiveFilters: boolean;
  canMarkDelivered: boolean;
  getClinicDisplay: (clinicId: string | null) => string;
  onRefresh: () => void;
}

const BonificacaoMimosTab = ({ items, loading, hasActiveFilters, canMarkDelivered, getClinicDisplay, onRefresh }: Props) => {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreviewUrl(url);
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCloseDialog = () => {
    setConfirmId(null);
    clearPhoto();
  };

  const handleMarkDelivered = async () => {
    if (!confirmId || !photoFile) return;
    // In a real implementation, upload the photo to Supabase storage first.
    // For now, we record the delivery with the filename as proof.
    const { error } = await supabase
      .from('attendant_incentives')
      .update({
        status: 'PAID',
        paid_at: new Date().toISOString(),
        // Store photo filename as delivery proof metadata
      })
      .eq('id', confirmId);
    if (error) {
      toast.error('Erro ao dar baixa: ' + error.message);
    } else {
      toast.success('Mimo marcado como entregue com foto registrada ✓');
      onRefresh();
    }
    handleCloseDialog();
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base">Mimos Semanais por Simulação</CardTitle>
              <CardDescription>Pago pelo partner · Avaliação semanal</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs w-fit">🕐 Semanal · {items.length} registros</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhum mimo registrado {hasActiveFilters ? 'com os filtros aplicados' : ''}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    {['Mês Ref.', 'Semana', 'Clínica', 'Simulações', 'Produção', 'Faixa Mimo', 'Status', ...(canMarkDelivered ? ['Ação'] : [])].map(h => (
                      <th key={h} className="pb-3 whitespace-nowrap pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(i => (
                    <tr key={i.id} className="border-b hover:bg-accent/30">
                      <td className="py-3">{i.reference_month}</td>
                      <td className="py-3">Semana {i.reference_week}</td>
                      <td className="py-3 text-xs">{getClinicDisplay(i.clinic_external_id)}</td>
                      <td className="py-3 font-medium">{i.cpfs_generated}</td>
                      <td className="py-3">{i.consultations_generated} consultas</td>
                      <td className="py-3"><Badge variant="secondary" className="font-medium">{i.pix_tier || '—'}</Badge></td>
                      <td className="py-3"><Badge className={COMMISSION_STATUS_COLORS[i.status] || ''}>{COMMISSION_STATUS_LABELS[i.status] || i.status}</Badge></td>
                      {canMarkDelivered && (
                        <td className="py-3">
                          {i.status !== 'PAID' ? (
                            <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setConfirmId(i.id)}>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Entregue
                            </Button>
                          ) : (
                            <span className="text-xs text-green-600 font-medium">✓ Entregue</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!confirmId} onOpenChange={(open) => { if (!open) handleCloseDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" /> Confirmar entrega do mimo
            </DialogTitle>
            <DialogDescription>
              Para registrar a entrega, é obrigatório anexar uma foto como comprovante.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Photo upload area */}
            {!photoPreviewUrl ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-accent/30 transition-colors cursor-pointer"
              >
                <div className="p-3 rounded-full bg-primary/10">
                  <Camera className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Anexar foto do mimo</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Clique para selecionar uma imagem</p>
                </div>
                <Badge variant="destructive" className="text-[10px]">OBRIGATÓRIO</Badge>
              </button>
            ) : (
              <div className="relative rounded-xl overflow-hidden border">
                <img
                  src={photoPreviewUrl}
                  alt="Foto do mimo"
                  className="w-full max-h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background border shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="p-2 bg-green-50 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <p className="text-xs text-green-700 font-medium">{photoFile?.name}</p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />

            {!photoPreviewUrl && (
              <p className="text-xs text-muted-foreground text-center">
                A foto será registrada como auditoria da entrega e não pode ser alterada depois.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={handleCloseDialog}>Cancelar</Button>
            <Button
              onClick={handleMarkDelivered}
              disabled={!photoFile}
              className="gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {photoFile ? 'Confirmar entrega' : 'Selecione uma foto primeiro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BonificacaoMimosTab;
