import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, AreaChart, Area } from 'recharts';
import { format, parseISO, subDays, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Metric {
  metric_date: string;
  seh_score: number | null;
  consultations: number;
  approvals: number;
  paid_amount: number;
  paid_contracts: number;
  partner_id: string;
}

interface Commission {
  reference_month: string;
  commission_amount: number;
  commission_type: string;
  status: string;
}

interface Props {
  metrics: Metric[];
  commissions: Commission[];
}

const periods = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
] as const;

const sehConfig: ChartConfig = {
  seh: { label: 'Score SEH', color: 'hsl(var(--primary))' },
};

const consultConfig: ChartConfig = {
  consultations: { label: 'Consultas', color: 'hsl(210, 80%, 55%)' },
  approvals: { label: 'Aprovações', color: 'hsl(142, 70%, 45%)' },
};

const commissionConfig: ChartConfig = {
  amount: { label: 'Bonificação (R$)', color: 'hsl(45, 90%, 50%)' },
};

export default function PartnerCharts({ metrics, commissions }: Props) {
  const [period, setPeriod] = useState<7 | 30 | 90>(30);

  const cutoff = useMemo(() => subDays(new Date(), period), [period]);

  const filteredMetrics = useMemo(
    () => metrics.filter(m => isAfter(parseISO(m.metric_date), cutoff)),
    [metrics, cutoff]
  );

  const sehData = useMemo(() => {
    const grouped = new Map<string, { sum: number; count: number }>();
    filteredMetrics.forEach((m) => {
      const date = m.metric_date;
      const prev = grouped.get(date) || { sum: 0, count: 0 };
      grouped.set(date, { sum: prev.sum + Number(m.seh_score || 0), count: prev.count + 1 });
    });
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        label: format(parseISO(date), 'dd/MM', { locale: ptBR }),
        seh: +(v.sum / v.count).toFixed(1),
      }));
  }, [filteredMetrics]);

  const consultData = useMemo(() => {
    const grouped = new Map<string, { consultations: number; approvals: number }>();
    filteredMetrics.forEach((m) => {
      const date = m.metric_date;
      const prev = grouped.get(date) || { consultations: 0, approvals: 0 };
      grouped.set(date, { consultations: prev.consultations + m.consultations, approvals: prev.approvals + m.approvals });
    });
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, label: format(parseISO(date), 'dd/MM', { locale: ptBR }), ...v }));
  }, [filteredMetrics]);

  const commissionData = useMemo(() => {
    const grouped = new Map<string, number>();
    commissions.forEach((c) => {
      const key = c.reference_month;
      grouped.set(key, (grouped.get(key) || 0) + Number(c.commission_amount));
    });
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, label: month, amount: +amount.toFixed(2) }));
  }, [commissions]);

  if (!metrics.length && !commissions.length) return null;

  return (
    <div className="space-y-4">
      {/* Period filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Período:</span>
        {periods.map(p => (
          <Button
            key={p.days}
            variant={period === p.days ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(p.days as 7 | 30 | 90)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Evolução SEH</CardTitle></CardHeader>
          <CardContent>
            {sehData.length > 0 ? (
              <ChartContainer config={sehConfig} className="h-[200px] w-full">
                <AreaChart data={sehData}>
                  <defs><linearGradient id="sehGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="seh" stroke="hsl(var(--primary))" fill="url(#sehGrad)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados para o período</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Consultas & Aprovações</CardTitle></CardHeader>
          <CardContent>
            {consultData.length > 0 ? (
              <ChartContainer config={consultConfig} className="h-[200px] w-full">
                <BarChart data={consultData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="consultations" fill="hsl(210, 80%, 55%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="approvals" fill="hsl(142, 70%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados para o período</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Bonificações por Mês</CardTitle></CardHeader>
          <CardContent>
            {commissionData.length > 0 ? (
              <ChartContainer config={commissionConfig} className="h-[200px] w-full">
                <LineChart data={commissionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="amount" stroke="hsl(45, 90%, 50%)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ChartContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
