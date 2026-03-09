import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Linkedin, Instagram, Youtube, Facebook } from 'lucide-react';
import logo from '@/assets/logo.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-sidebar text-sidebar-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center mb-6">
              <img src={logo} alt="HelpUde" className="h-[120px]" />
            </Link>
            <p className="text-sidebar-foreground/70 text-sm leading-relaxed mb-6">
              Transformando a forma como clínicas de saúde oferecem crédito aos seus pacientes.
            </p>
            <div className="flex gap-4">
              <a href="https://www.linkedin.com/company/helpude/?viewAsMember=true" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center hover:bg-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/helpude/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center hover:bg-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61572487797872" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center hover:bg-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@HelpUde/shorts" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center hover:bg-primary transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-display font-semibold text-white mb-6">Níveis</h4>
            <ul className="space-y-3">
              {['Nível Básico', 'Nível Profissional', 'Nível Enterprise'].map((item) => (
                <li key={item}>
                  <a href="#pricing" className="text-sidebar-foreground/70 hover:text-white text-sm transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-semibold text-white mb-6">Empresa</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sidebar-foreground/70 hover:text-white text-sm transition-colors">
                  Sobre
                </a>
              </li>
              <li>
                <a href="#features" className="text-sidebar-foreground/70 hover:text-white text-sm transition-colors">
                  Recursos
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-white mb-6">Contato</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-helpude-teal" />
                <a href="mailto:contato@helpude.com.br" className="text-sidebar-foreground/70 hover:text-white text-sm transition-colors">
                  contato@helpude.com.br
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-helpude-teal" />
                <a href="https://wa.me/551151921464" target="_blank" rel="noopener noreferrer" className="text-sidebar-foreground/70 hover:text-white text-sm transition-colors">
                  (11) 5192-1464
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-helpude-teal flex-shrink-0 mt-0.5" />
                <span className="text-sidebar-foreground/70 text-sm">
                  São Paulo, SP - Brasil
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal disclaimer */}
        <div className="border-t border-sidebar-border mt-12 pt-8">
          <p className="text-sidebar-foreground/40 text-xs leading-relaxed max-w-5xl">
            A HelpUde é uma Healthtech que oferece serviço 100% digital, não é uma instituição financeira e não realiza operações de crédito diretamente. A HelpUde é uma plataforma digital pertencente a R2A Soluções LTDA 20.451.457/0001-20, matriz: Alameda Salvador, Edifício Salvador Shopping Business, Torre Europa, Sala 1818, Caminho das Árvores, Salvador – Bahia. CEP: 41820-790. Filial: Avenida Paulista 1106, Andar 16 - Bela Vista - São Paulo SP - CEP: 01310-914. Que atua como correspondente bancário, seguindo as diretrizes do Banco Central do Brasil, nos termos da Resolução CMN 4.935/2021, do BACEN. Toda avaliação de crédito será realizada conforme a política de crédito da Instituição Financeira escolhida pelo usuário. Antes da contratação de qualquer serviço através de nossos parceiros, você receberá todas as condições e informações relativas ao produto a ser contratado, de forma completa e transparente.
          </p>
        </div>

        {/* Copyright & links */}
        <div className="border-t border-sidebar-border mt-6 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sidebar-foreground/50 text-sm">
            © {currentYear} HelpUde. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sidebar-foreground/50 hover:text-white text-sm transition-colors">
              Termos de Uso
            </a>
            <a href="#" className="text-sidebar-foreground/50 hover:text-white text-sm transition-colors">
              Política de Privacidade
            </a>
            <a href="#" className="text-sidebar-foreground/50 hover:text-white text-sm transition-colors">
              LGPD
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
