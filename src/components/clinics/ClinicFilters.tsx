import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Search, RefreshCw, X } from 'lucide-react';

interface ClinicFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  onDateFromChange: (d: Date | undefined) => void;
  onDateToChange: (d: Date | undefined) => void;
  partners: { id: string; legal_name: string; type: string }[];
  selectedPartnerId: string;
  onPartnerChange: (v: string) => void;
  /** Hide partner/master filters when used inside partner context */
  hidePartnerFilter?: boolean;
  onRefresh: () => void;
}

const ClinicFilters = ({
  search, onSearchChange,
  dateFrom, dateTo, onDateFromChange, onDateToChange,
  partners, selectedPartnerId, onPartnerChange,
  hidePartnerFilter,
  onRefresh,
}: ClinicFiltersProps) => {
  const masterPartners = partners.filter(p => p.type === 'MASTER');
  const regularPartners = partners.filter(p => p.type === 'PARTNER');

  const hasActiveFilters = dateFrom || dateTo || selectedPartnerId !== 'all' || search;

  const clearFilters = () => {
    onSearchChange('');
    onDateFromChange(undefined);
    onDateToChange(undefined);
    onPartnerChange('all');
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clínica ou partner..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Date From */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Data início"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={onDateFromChange} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>

        {/* Date To */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, "dd/MM/yyyy") : "Data fim"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={onDateToChange} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>

        {/* Partner / Master Partner Filter */}
        {!hidePartnerFilter && (
          <Select value={selectedPartnerId} onValueChange={onPartnerChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os partners" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os partners</SelectItem>
              {masterPartners.length > 0 && (
                <>
                  <SelectItem value="__master_header" disabled>— Master Partners —</SelectItem>
                  {masterPartners.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.legal_name}</SelectItem>
                  ))}
                </>
              )}
              {regularPartners.length > 0 && (
                <>
                  <SelectItem value="__partner_header" disabled>— Partners —</SelectItem>
                  {regularPartners.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.legal_name}</SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" /> Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
};

export default ClinicFilters;
