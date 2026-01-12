import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Upload, FileSpreadsheet, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { z } from 'zod';

const cpfSchema = z.string().regex(/^\d{11}$/, 'CPF deve conter 11 dígitos');

interface ConsultaFormProps {
  onConsulta: (cpfs: string[]) => void;
  consultasRestantes: number;
}

const ConsultaForm = ({ onConsulta, consultasRestantes }: ConsultaFormProps) => {
  const [cpf, setCpf] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    return numbers;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handleIndividualConsulta = async () => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('Por favor, envie um arquivo CSV.');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleBatchConsulta = async () => {
    if (!file) {
      toast.error('Por favor, selecione um arquivo CSV.');
      return;
    }

    setIsLoading(true);
    // Simular processamento do arquivo
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock de CPFs do arquivo
    const mockCpfs = ['12345678901', '98765432109', '11122233344'];
    onConsulta(mockCpfs);
    toast.success(`${mockCpfs.length} consultas realizadas com sucesso!`);
    setFile(null);
    setIsLoading(false);
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-bold text-foreground">Nova Consulta</h3>
        <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
          <span className="text-sm text-muted-foreground">Restantes:</span>
          <span className="text-lg font-bold text-primary">{consultasRestantes}</span>
        </div>
      </div>

      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-2">
          <TabsTrigger value="individual" className="gap-2">
            <Search className="h-4 w-4" />
            Individual
          </TabsTrigger>
          <TabsTrigger value="lote" className="gap-2">
            <Upload className="h-4 w-4" />
            Em Lote
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF do Cliente</Label>
              <div className="flex gap-2">
                <Input
                  id="cpf"
                  type="text"
                  placeholder="Digite o CPF (apenas números)"
                  value={cpf}
                  onChange={handleCpfChange}
                  className="flex-1 bg-background/50"
                  maxLength={11}
                />
                <Button
                  onClick={handleIndividualConsulta}
                  disabled={isLoading || cpf.length !== 11}
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
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
              </div>
              <p className="text-xs text-muted-foreground">
                {cpf.length}/11 dígitos
              </p>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="lote">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Arquivo CSV</Label>
              <div
                className={`relative flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                  file
                    ? 'border-success bg-success/5'
                    : 'border-border hover:border-primary hover:bg-primary/5'
                }`}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                {file ? (
                  <div className="flex items-center gap-3 p-4">
                    <FileSpreadsheet className="h-8 w-8 text-success" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Arraste um arquivo CSV ou clique para selecionar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      O arquivo deve conter uma coluna com os CPFs
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleBatchConsulta}
              disabled={isLoading || !file}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Processar Arquivo
                </>
              )}
            </Button>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConsultaForm;
