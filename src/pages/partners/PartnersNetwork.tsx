import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Lock } from 'lucide-react';

const PartnersNetwork = () => {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-12 text-center space-y-4">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <h2 className="text-lg font-semibold text-foreground">Conteúdo não disponível</h2>
            <p className="text-sm text-muted-foreground">
              Esta área não está disponível neste perfil de acesso.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PartnersNetwork;
