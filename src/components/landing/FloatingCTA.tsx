import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FloatingCTA = () => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 1, duration: 0.4 }}
    className="fixed bottom-6 left-6 z-40"
  >
    <Link to="/cadastroclinica">
      <Button variant="hero" size="lg" className="rounded-full gap-2 shadow-2xl">
        <Stethoscope className="w-5 h-5" />
        Cadastrar minha clínica
      </Button>
    </Link>
  </motion.div>
);

export default FloatingCTA;