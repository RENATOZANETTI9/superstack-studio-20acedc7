import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import phoneImg from '@/assets/phone-clean.png';

const AnimatedPhone = () => {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const formatted = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative w-full max-w-sm mx-auto"
    >
      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        <img
          src={phoneImg}
          alt="Celular exibindo a tela de bloqueio com o horário atual"
          className="w-full h-auto select-none pointer-events-none"
          loading="lazy"
        />
        <span
          aria-hidden="true"
          className="absolute font-display font-light text-white/95 tracking-tight leading-none"
          style={{
            left: '35%',
            top: '26%',
            fontSize: 'clamp(1.8rem, 7vw, 3.2rem)',
            transform: 'translate(-50%, -50%) rotate(-13deg) skewY(3deg)',
            textShadow: '0 2px 12px rgba(0,0,0,0.25)',
          }}
        >
          {formatted}
        </span>
      </motion.div>
    </motion.div>
  );
};

export default AnimatedPhone;