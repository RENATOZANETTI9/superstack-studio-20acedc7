import { useState, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  onValidChange?: (isValid: boolean) => void;
  readOnly?: boolean;
  minHeight?: string;
}

interface JsonError {
  message: string;
  line: number | null;
  column: number | null;
}

const parseJsonError = (error: SyntaxError, text: string): JsonError => {
  const match = error.message.match(/position (\d+)/);
  if (match) {
    const pos = parseInt(match[1]);
    const lines = text.substring(0, pos).split('\n');
    return {
      message: error.message.replace(/JSON\.parse: /, '').replace(/ at position \d+.*/, ''),
      line: lines.length,
      column: (lines[lines.length - 1]?.length || 0) + 1,
    };
  }
  
  // Try to extract line/column from other error formats
  const lineMatch = error.message.match(/line (\d+)/i);
  const colMatch = error.message.match(/column (\d+)/i);
  
  return {
    message: error.message,
    line: lineMatch ? parseInt(lineMatch[1]) : null,
    column: colMatch ? parseInt(colMatch[1]) : null,
  };
};

const JsonEditor = ({ value, onChange, onValidChange, readOnly = false, minHeight = '200px' }: JsonEditorProps) => {
  const [error, setError] = useState<JsonError | null>(null);
  const [isValid, setIsValid] = useState(true);

  const validate = useCallback((text: string) => {
    if (!text.trim()) {
      setError({ message: 'O campo JSON não pode estar vazio', line: null, column: null });
      setIsValid(false);
      onValidChange?.(false);
      return;
    }
    try {
      JSON.parse(text);
      setError(null);
      setIsValid(true);
      onValidChange?.(true);
    } catch (e) {
      const jsonError = parseJsonError(e as SyntaxError, text);
      setError(jsonError);
      setIsValid(false);
      onValidChange?.(false);
    }
  }, [onValidChange]);

  useEffect(() => {
    validate(value);
  }, [value, validate]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Valor (JSON)</label>
        {isValid ? (
          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 gap-1">
            <CheckCircle className="h-3 w-3" /> JSON válido
          </Badge>
        ) : (
          <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50 gap-1">
            <AlertTriangle className="h-3 w-3" /> JSON inválido
          </Badge>
        )}
      </div>
      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        readOnly={readOnly}
        className={`font-mono text-xs ${minHeight ? `min-h-[${minHeight}]` : 'min-h-[200px]'} transition-colors ${
          !isValid ? 'border-red-400 focus-visible:ring-red-400 bg-red-50/30' : 'border-green-300 focus-visible:ring-green-400'
        }`}
        style={{ minHeight }}
      />
      {error && (
        <div className="p-2.5 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 space-y-0.5">
          <p className="font-medium flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Erro de sintaxe JSON
          </p>
          <p>{error.message}</p>
          {error.line && (
            <p className="text-red-500">
              📍 Linha {error.line}{error.column ? `, coluna ${error.column}` : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default JsonEditor;
