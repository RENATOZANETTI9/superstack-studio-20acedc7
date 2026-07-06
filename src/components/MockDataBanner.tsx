import { AlertTriangle } from 'lucide-react';

interface MockDataBannerProps {
  show: boolean;
  className?: string;
}

/**
 * Discreet yellow banner shown at the top of a section when mock/demo data is
 * being displayed because the backend returned no real records.
 */
export function MockDataBanner({ show, className }: MockDataBannerProps) {
  if (!show) return null;
  return (
    <div
      role="status"
      className={`flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-md mb-4 text-sm text-yellow-800 ${className ?? ''}`}
    >
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span>
        <strong>Modo demonstração:</strong> dados fictícios exibidos para
        visualização. Conecte sua conta para ver dados reais.
      </span>
    </div>
  );
}

export default MockDataBanner;