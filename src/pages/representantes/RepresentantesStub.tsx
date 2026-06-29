import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

const RepresentantesStub = ({ title }: { title: string }) => (
  <DashboardLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">Módulo de Representantes</p>
      </div>
      <Card>
        <CardContent className="py-16 flex flex-col items-center justify-center gap-3 text-center">
          <div className="p-3 rounded-full bg-primary/10">
            <Construction className="h-8 w-8 text-primary" />
          </div>
          <p className="text-lg font-semibold">Em construção</p>
          <p className="text-sm text-muted-foreground max-w-md">
            Esta seção está sendo desenvolvida e estará disponível em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  </DashboardLayout>
);

export default RepresentantesStub;