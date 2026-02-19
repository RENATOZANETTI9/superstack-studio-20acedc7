import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Shield, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import logoPinSrc from '@/assets/logo-pin.png';

// Brazil state pin positions (% of SVG viewBox 0 0 500 540)
const brazilPins = [
  { id: 'SP', x: 52, y: 72, label: 'São Paulo' },
  { id: 'RJ', x: 56, y: 70, label: 'Rio de Janeiro' },
  { id: 'MG', x: 53, y: 64, label: 'Minas Gerais' },
  { id: 'RS', x: 44, y: 88, label: 'Rio Grande do Sul' },
  { id: 'PR', x: 47, y: 79, label: 'Paraná' },
  { id: 'SC', x: 46, y: 83, label: 'Santa Catarina' },
  { id: 'BA', x: 60, y: 56, label: 'Bahia' },
  { id: 'GO', x: 48, y: 57, label: 'Goiás' },
  { id: 'DF', x: 50, y: 57, label: 'Distrito Federal' },
  { id: 'PE', x: 66, y: 45, label: 'Pernambuco' },
  { id: 'CE', x: 64, y: 37, label: 'Ceará' },
  { id: 'MA', x: 56, y: 34, label: 'Maranhão' },
  { id: 'PA', x: 47, y: 28, label: 'Pará' },
  { id: 'AM', x: 28, y: 25, label: 'Amazonas' },
  { id: 'MT', x: 40, y: 50, label: 'Mato Grosso' },
  { id: 'MS', x: 44, y: 67, label: 'Mato Grosso do Sul' },
  { id: 'RN', x: 68, y: 39, label: 'Rio Grande do Norte' },
  { id: 'PB', x: 68, y: 43, label: 'Paraíba' },
  { id: 'AL', x: 67, y: 49, label: 'Alagoas' },
  { id: 'ES', x: 58, y: 65, label: 'Espírito Santo' },
  { id: 'TO', x: 51, y: 43, label: 'Tocantins' },
  { id: 'RO', x: 31, y: 38, label: 'Rondônia' },
];

const infographics = [
  { value: '+1.580', label: 'Profissionais da área de saúde' },
  { value: '+1.000', label: 'Clínicas de Grande e Pequeno Porte ativas' },
  { value: '+106', label: 'Cidades do Brasil' },
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

          {/* Brazil Map Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mb-6"
          >
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-2 leading-snug">
              Impactando Clínicas<br />em Todo o Brasil
            </h2>
            <p className="text-white/50 text-sm mb-8">De norte a sul, transformando o acesso à saúde</p>

            {/* Map Container */}
            <div className="relative mx-auto" style={{ maxWidth: 420 }}>
              {/* Glow behind map */}
              <div className="absolute inset-0 bg-helpude-purple/10 rounded-3xl blur-2xl" />
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-4 overflow-hidden">
                <svg
                  viewBox="0 0 500 540"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-auto"
                  aria-label="Mapa do Brasil com presença HelpUde"
                >
                  {/* Brazil outline - simplified shape */}
                  <path
                    d="M 155 20 
                       L 165 18 L 185 22 L 200 20 L 215 25 L 230 22 L 245 28 L 255 25 
                       L 270 30 L 285 28 L 300 35 L 310 30 L 325 38 L 335 35 L 345 42
                       L 350 50 L 345 60 L 355 68 L 360 80 L 355 90 L 365 100
                       L 370 115 L 365 125 L 370 135 L 368 145 L 375 155
                       L 372 165 L 368 175 L 375 185 L 372 195 L 365 205
                       L 358 215 L 355 225 L 348 232 L 340 238 L 330 242
                       L 318 248 L 308 255 L 300 262 L 292 270 L 285 280
                       L 278 290 L 272 300 L 268 312 L 262 322 L 255 330
                       L 248 340 L 242 352 L 238 365 L 235 378 L 232 390
                       L 228 402 L 222 412 L 215 422 L 208 430 L 200 436
                       L 192 442 L 183 445 L 175 442 L 166 438 L 158 432
                       L 150 424 L 143 415 L 138 405 L 135 393 L 132 380
                       L 128 368 L 122 356 L 115 344 L 110 330 L 108 318
                       L 106 306 L 105 294 L 108 282 L 112 272 L 118 262
                       L 122 252 L 120 240 L 115 230 L 108 220 L 102 210
                       L 95 200 L 88 190 L 82 178 L 78 166 L 80 154
                       L 85 142 L 88 130 L 85 118 L 80 108 L 75 98
                       L 72 86 L 75 74 L 82 64 L 88 55 L 95 47
                       L 105 40 L 118 33 L 132 26 L 145 22 Z"
                    fill="rgba(123, 95, 199, 0.15)"
                    stroke="rgba(123, 95, 199, 0.5)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />

                  {/* State divisions - subtle lines */}
                  <g stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" fill="none">
                    <line x1="200" y1="50" x2="250" y2="120" />
                    <line x1="250" y1="120" x2="300" y2="150" />
                    <line x1="200" y1="120" x2="250" y2="180" />
                    <line x1="150" y1="150" x2="250" y2="180" />
                    <line x1="150" y1="220" x2="280" y2="200" />
                    <line x1="180" y1="280" x2="290" y2="250" />
                    <line x1="180" y1="330" x2="270" y2="320" />
                    <line x1="160" y1="380" x2="255" y2="370" />
                  </g>

                  {/* Pins */}
                  {brazilPins.map((pin, index) => {
                    const px = (pin.x / 100) * 500;
                    const py = (pin.y / 100) * 540;
                    return (
                      <motion.g
                        key={pin.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.8 + index * 0.05 }}
                      >
                        {/* Pin shadow */}
                        <circle cx={px} cy={py + 1} r="8" fill="rgba(0,0,0,0.3)" />
                        {/* Pin circle background */}
                        <circle
                          cx={px}
                          cy={py}
                          r="8"
                          fill="white"
                          stroke="rgba(123, 95, 199, 0.6)"
                          strokeWidth="1"
                        />
                        {/* Logo image inside pin */}
                        <image
                          href={logoPinSrc}
                          x={px - 5.5}
                          y={py - 5.5}
                          width="11"
                          height="11"
                          preserveAspectRatio="xMidYMid meet"
                        />
                        {/* Pulse ring */}
                        <circle
                          cx={px}
                          cy={py}
                          r="12"
                          fill="none"
                          stroke="rgba(123, 95, 199, 0.3)"
                          strokeWidth="1"
                          opacity="0.6"
                        />
                      </motion.g>
                    );
                  })}
                </svg>

                {/* Decorative corner dots */}
                <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-helpude-teal/60" />
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-helpude-purple/60" />
                <div className="absolute bottom-3 left-3 w-2 h-2 rounded-full bg-helpude-purple/60" />
                <div className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-helpude-teal/60" />
              </div>
            </div>
          </motion.div>

          {/* Infographics */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            {infographics.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.7 + index * 0.08 }}
                className="glass-card rounded-2xl p-4 bg-white/5 border-white/10 text-center"
              >
                <div className="text-2xl md:text-3xl font-display font-bold text-white mb-1">
                  {item.value}
                </div>
                <div className="text-white/60 text-xs leading-snug">{item.label}</div>
              </motion.div>
            ))}
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
