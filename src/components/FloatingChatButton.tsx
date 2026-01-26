import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const FloatingChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      "fixed z-50",
      isMobile ? "bottom-20 right-4" : "bottom-6 right-6"
    )}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute bottom-14 sm:bottom-16 right-0 mb-2 rounded-2xl glass-card border border-border/50 shadow-2xl overflow-hidden",
              isMobile ? "w-[calc(100vw-2rem)] max-w-80 -right-2" : "w-80"
            )}
          >
            {/* Header */}
            <div className="bg-primary p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/20">
                  <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-white">Suporte Help</h3>
                  <p className="text-[10px] sm:text-xs text-white/80">Online agora</p>
                </div>
              </div>
            </div>

            {/* Chat Body */}
            <div className="p-3 sm:p-4 h-48 sm:h-64 flex flex-col">
              <div className="flex-1 space-y-3">
                {/* Welcome Message */}
                <div className="flex gap-2">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm p-2.5 sm:p-3 max-w-[85%]">
                    <p className="text-xs sm:text-sm text-foreground">
                      Olá! 👋 Como posso ajudar você hoje?
                    </p>
                  </div>
                </div>
              </div>

              {/* Input */}
              <div className="mt-3 sm:mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  className="flex-1 rounded-xl border border-border bg-background px-3 sm:px-4 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <Button size="icon" className="rounded-xl h-9 w-9 sm:h-10 sm:w-10">
                  <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center rounded-full shadow-lg transition-colors",
          isMobile ? "h-12 w-12" : "h-14 w-14",
          "bg-primary hover:bg-primary/90",
          isOpen && "bg-destructive hover:bg-destructive/90"
        )}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className={cn("text-white", isMobile ? "h-5 w-5" : "h-6 w-6")} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className={cn("text-white", isMobile ? "h-5 w-5" : "h-6 w-6")} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Pulse animation when closed */}
      {!isOpen && (
        <span className={cn(
          "absolute rounded-full bg-primary/30 animate-ping",
          isMobile ? "-inset-0.5" : "-inset-1"
        )} />
      )}
    </div>
  );
};

export default FloatingChatButton;
