import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface BonificacaoEvolutionChartProps {
  commissions: any[];
}

const chartConfig = {
  direct: { label: 'Direta (1,6%)', color: 'hsl(var(--primary))' },
  override: { label: 'Rede (0,2%)', color: 'hsl(280 60% 50%)' },
};

const BonificacaoEvolutionChart = ({ commissions }: BonificacaoEvolutionChartProps) => {
  const chartData = useMemo(() => {
    const monthMap: Record<string, { direct: number; override: number }> = {};

    for (const c of commissions) {
      const month = c.reference_month || 'N/A';
      if (!monthMap[month]) monthMap[month] = { direct: 0, override: 0 };
      const amount = Number(c.commission_amount || 0);
      if (c.commission_type === 'DIRECT') monthMap[month].direct += amount;
      else if (c.commission_type === 'OVERRIDE') monthMap[month].override += amount;
    }

    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, vals]) => ({
        month: formatMonth(month),
        direct: Number(vals.direct.toFixed(2)),
        override: Number(vals.override.toFixed(2)),
      }));
  }, [commissions]);

  if (chartData.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Evolução Mensal de Bonificações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[220px] sm:h-[280px] w-full">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              width={50}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    const label = name === 'direct' ? 'Direta' : 'Rede';
                    return (
                      <span>
                        {label}: <strong>R$ {Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                      </span>
                    );
                  }}
                />
              }
            />
            <Bar dataKey="direct" fill="var(--color-direct)" radius={[4, 4, 0, 0]} name="direct" />
            <Bar dataKey="override" fill="var(--color-override)" radius={[4, 4, 0, 0]} name="override" />
          </BarChart>
        </ChartContainer>
        <div className="flex items-center justify-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-primary" />
            <span className="text-[10px] sm:text-xs text-muted-foreground">Direta (1,6%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: 'hsl(280 60% 50%)' }} />
            <span className="text-[10px] sm:text-xs text-muted-foreground">Rede (0,2%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function formatMonth(m: string): string {
  const [year, month] = m.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const idx = parseInt(month, 10) - 1;
  return `${months[idx] || m}/${year?.slice(2) || ''}`;
}

export default BonificacaoEvolutionChart;
