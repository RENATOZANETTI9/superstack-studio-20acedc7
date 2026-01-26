import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';

const cpfSchema = z.string().regex(/^\d{11}$/, 'CPF deve conter 11 dígitos');

interface ConsultaFormProps {
  onConsulta: (cpfs: string[]) => void;
  consultasRestantes: number;
  gatilhosRestantes?: number;
}

const ConsultaForm = ({ onConsulta, consultasRestantes, gatilhosRestantes = 50 }: ConsultaFormProps) => {
  const [cpf, setCpf] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    return numbers;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handleConsulta = async () => {
    try {
      cpfSchema.parse(cpf);
      
      if (consultasRestantes <= 0) {
        toast.error('Você atingiu o limite de consultas do seu combo.');
        return;
      }

      setIsLoading(true);
      // Simular consulta
      await new Promise(resolve => setTimeout(resolve, 1500));
      onConsulta([cpf]);
      toast.success('Consulta realizada com sucesso!');
      setCpf('');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-foreground">Nova Consulta</h3>
        </div>
        
        {/* Credits Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg bg-primary/10 px-4 py-2">
            <span className="text-sm text-muted-foreground">Consultas:</span>
            <span className="text-lg font-bold text-primary">{consultasRestantes}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-secondary/10 px-4 py-2">
            <span className="text-sm text-muted-foreground">Gatilhos Marketing:</span>
            <span className="text-lg font-bold text-secondary">{gatilhosRestantes}</span>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF do Paciente</Label>
          <Input
            id="cpf"
            type="text"
            placeholder="Digite o CPF (apenas números)"
            value={cpf}
            onChange={handleCpfChange}
            className="bg-background/50"
            maxLength={11}
          />
          <p className="text-xs text-muted-foreground">
            {cpf.length}/11 dígitos
          </p>
        </div>

        <Button
          onClick={handleConsulta}
          disabled={isLoading || cpf.length !== 11}
          className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Consultar
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
};

export default ConsultaForm;
