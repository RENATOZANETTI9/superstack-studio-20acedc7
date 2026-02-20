import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import logoPinSrc from '@/assets/logo-pin.png';
import brazilMapSrc from '@/assets/brazil-map.png';

// Pin positions calibrated to Brasil-2.png map boundaries
// The map landmass sits roughly within x:12-82%, y:4-96% of the image
const brazilPins = [
  // Norte
  { id: 'RR',       x: 30,  y: 10,  label: 'Boa Vista' },
  { id: 'AM',       x: 25,  y: 25,  label: 'Manaus' },
  { id: 'PA',       x: 52,  y: 18,  label: 'Belém' },
  { id: 'Altamira', x: 42,  y: 28,  label: 'Altamira' },
  { id: 'RO',       x: 28,  y: 42,  label: 'Porto Velho' },
  { id: 'TO',       x: 52,  y: 38,  label: 'Palmas' },
  // Nordeste
  { id: 'MA',       x: 60,  y: 22,  label: 'São Luís' },
  { id: 'CE',       x: 72,  y: 20,  label: 'Fortaleza' },
  { id: 'RN',       x: 80,  y: 26,  label: 'Natal' },
  { id: 'PI',       x: 64,  y: 32,  label: 'Teresina' },
  { id: 'PB',       x: 82,  y: 30,  label: 'João Pessoa' },
  { id: 'PE',       x: 78,  y: 34,  label: 'Recife' },
  { id: 'AL',       x: 80,  y: 38,  label: 'Maceió' },
  { id: 'SE',       x: 76,  y: 42,  label: 'Aracaju' },
  // Bahia
  { id: 'BA',       x: 70,  y: 48,  label: 'Salvador' },
  { id: 'BA2',      x: 62,  y: 44,  label: 'Barreiras' },
  { id: 'BA3',      x: 66,  y: 52,  label: 'Feira de Santana' },
  { id: 'BA4',      x: 58,  y: 50,  label: 'Vitória da Conquista' },
  { id: 'BA5',      x: 64,  y: 56,  label: 'Ilhéus' },
  // Centro-Oeste
  { id: 'MT',       x: 38,  y: 44,  label: 'Cuiabá' },
  { id: 'GO',       x: 52,  y: 54,  label: 'Goiânia' },
  { id: 'DF',       x: 60,  y: 58,  label: 'Brasília' },
  { id: 'MS',       x: 40,  y: 62,  label: 'Campo Grande' },
  // Sudeste
  { id: 'MG',       x: 64,  y: 58,  label: 'Belo Horizonte' },
  { id: 'ES',       x: 74,  y: 60,  label: 'Vitória' },
  { id: 'SP',       x: 52,  y: 70,  label: 'São Paulo' },
  { id: 'RJ',       x: 66,  y: 68,  label: 'Rio de Janeiro' },
  // Sul
  { id: 'PR',       x: 50,  y: 78,  label: 'Curitiba' },
  { id: 'SC',       x: 54,  y: 84,  label: 'Florianópolis' },
];

const infographics = [
  { value: '+1.580', label: 'Profissionais da área de saúde' },
  { value: '+1.000', label: 'Clínicas de Grande e Pequeno Porte ativas' },
  { value: '+106',   label: 'Cidades do Brasil' },
  { value: '+4.827', label: 'Procedimentos médicos por mês' },
];

const Hero = () => {
  return (
    <section className="relative min-h-screen gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-hero-pattern opacity-30" />

      {/* Animated Gradient Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-helpude-purple/30 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-helpude-teal/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />

      <div className="container relative z-10 mx-auto px-4 pt-32 pb-20">
        <div className="max-w-5xl mx-auto text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8"
          >
            <Sparkles className="w-4 h-4 text-helpude-teal-light" />
            <span className="text-white/90 text-sm font-medium">
              Plataforma #1 em Crédito para Clínicas
            </span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 leading-tight"
          >
            Seu paciente precisa do{' '}
            <span className="bg-gradient-to-r from-helpude-teal-light to-helpude-teal bg-clip-text text-transparent">
              tratamento
            </span>
            , mas não pode pagar?
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            O HelpUde conecta clínicas de saúde a soluções de crédito personalizadas,
            permitindo que mais pacientes tenham acesso aos tratamentos que precisam.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link to="/dashboard">
              <Button variant="hero" size="xl" className="group">
                Começar Agora
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="heroOutline" size="xl">
                Já tenho conta
              </Button>
            </Link>
          </motion.div>

          {/* Map + Infographics Side by Side */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="flex flex-col md:flex-row items-center gap-8 md:gap-12 max-w-5xl mx-auto"
          >
            {/* Left: Map */}
            <div className="relative flex-shrink-0 w-full md:w-[340px] lg:w-[400px]">
              <div className="relative overflow-hidden">
                {/* Map image */}
                <img
                  src={brazilMapSrc}
                  alt="Mapa do Brasil"
                  className="w-full h-auto"
                  style={{ filter: 'drop-shadow(0 0 12px rgba(123,95,199,0.25))' }}
                />

                {/* SVG overlay — viewBox 0 0 100 100 so pin coords = % of image */}
                <svg
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute inset-0 w-full h-full"
                  aria-label="Pins HelpUde no Brasil"
                >
                  {brazilPins.map((pin, index) => (
                    <motion.g
                      key={pin.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35, delay: 0.9 + index * 0.05 }}
                    >
                      {/* drop shadow */}
                      <circle cx={pin.x} cy={pin.y + 0.4} r="1.6" fill="rgba(0,0,0,0.25)" />
                      {/* white bg circle */}
                      <circle cx={pin.x} cy={pin.y} r="1.6" fill="white" stroke="rgba(123,95,199,0.85)" strokeWidth="0.35" />
                      {/* logo icon */}
                      <image
                        href={logoPinSrc}
                        x={pin.x - 1}
                        y={pin.y - 1}
                        width="2"
                        height="2"
                        preserveAspectRatio="xMidYMid meet"
                      />
                      {/* outer halo */}
                      <circle cx={pin.x} cy={pin.y} r="2.8" fill="none" stroke="rgba(123,95,199,0.18)" strokeWidth="0.5" />
                    </motion.g>
                  ))}
                </svg>
              </div>
            </div>

            {/* Right: Title + Infographics */}
            <div className="flex-1 text-left w-full">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-3 leading-tight">
                Impactando Clínicas<br />em Todo o Brasil
              </h2>
              <p className="text-white/50 text-sm mb-8">De norte a sul, transformando o acesso à saúde</p>

              {/* Infographics Grid */}
              <div className="grid grid-cols-2 gap-4">
                {infographics.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                    className="glass-card rounded-2xl p-4 bg-white/5 border border-white/10 text-left"
                  >
                    <div className="text-2xl md:text-3xl font-display font-bold text-white mb-1">
                      {item.value}
                    </div>
                    <div className="text-white/60 text-xs leading-snug">{item.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </section>
  );
};

export default Hero;
