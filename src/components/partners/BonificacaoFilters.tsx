import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Filter, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface BonificacaoFiltersProps {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  filterClinic: string;
  filterAttendant: string;
  filterStatus: string;
  clinicIds: string[];
  attendantIds: string[];
  clinicNameMap?: Record<string, string>;
  onDateFromChange: (d: Date | undefined) => void;
  onDateToChange: (d: Date | undefined) => void;
  onFilterClinicChange: (v: string) => void;
  onFilterAttendantChange: (v: string) => void;
  onFilterStatusChange: (v: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const BonificacaoFilters = ({
  dateFrom, dateTo, filterClinic, filterAttendant, filterStatus,
  clinicIds, attendantIds,
  onDateFromChange, onDateToChange, onFilterClinicChange, onFilterAttendantChange, onFilterStatusChange,
  onClearFilters, hasActiveFilters,
}: BonificacaoFiltersProps) => (
  <Card>
    <CardContent className="pt-4 pb-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filtros</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Data início"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={onDateFromChange} className="p-3 pointer-events-auto" locale={ptBR} />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, "dd/MM/yyyy") : "Data fim"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={onDateToChange} className="p-3 pointer-events-auto" locale={ptBR} />
          </PopoverContent>
        </Popover>
        <Select value={filterClinic} onValueChange={onFilterClinicChange}>
          <SelectTrigger><SelectValue placeholder="Clínica" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas as Clínicas</SelectItem>
            {clinicIds.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterAttendant} onValueChange={onFilterAttendantChange}>
          <SelectTrigger><SelectValue placeholder="Atendente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos Atendentes</SelectItem>
            {attendantIds.map(id => <SelectItem key={id} value={id}>{id.substring(0, 8)}...</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={onFilterStatusChange}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos Status</SelectItem>
            <SelectItem value="CALCULATED">Calculado</SelectItem>
            <SelectItem value="READY_FOR_PAYOUT">Pronto p/ Pagamento</SelectItem>
            <SelectItem value="PAID">Pago</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={onClearFilters}>✕ Limpar filtros</Button>
      )}
    </CardContent>
  </Card>
);

export default BonificacaoFilters;
