import { motion } from 'framer-motion';
import { Check, Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  title: string;
  description: string;
  audience: string;
  active: boolean;
  comingSoon?: boolean;
  onClick?: () => void;
}

const ProductCard = ({ 
  title, 
  description, 
  audience, 
  active, 
  comingSoon,
  onClick 
}: ProductCardProps) => {
  return (
    <motion.div
      whileHover={active ? { scale: 1.02 } : {}}
      className={cn(
        'glass-card relative overflow-hidden rounded-2xl p-6 transition-all',
        active 
          ? 'cursor-pointer border-primary/50 hover:border-primary hover:shadow-lg' 
          : 'cursor-not-allowed opacity-60'
      )}
      onClick={active ? onClick : undefined}
    >
      {/* Status Badge */}
      <div className="absolute right-4 top-4">
        {active ? (
          <Badge className="bg-success text-success-foreground">
            <Check className="mr-1 h-3 w-3" />
            Ativo
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            <Clock className="mr-1 h-3 w-3" />
            Em Breve
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="pr-20">
        <h3 className="mb-2 text-xl font-bold text-foreground">{title}</h3>
        <p className="mb-4 text-sm text-muted-foreground">{description}</p>
        
        {/* Audience */}
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-primary" />
          <span className="font-semibold text-primary">{audience}</span>
          <span className="text-muted-foreground">de público potencial</span>
        </div>
      </div>

      {/* Action */}
      {active && (
        <div className="mt-6">
          <Button 
            className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            onClick={onClick}
          >
            Acessar Produto
          </Button>
        </div>
      )}

      {/* Gradient Overlay for inactive */}
      {!active && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
      )}
    </motion.div>
  );
};

export default ProductCard;
