import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Linkedin, Instagram, Youtube } from 'lucide-react';
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
              <img src={logo} alt="HelpUde" className="h-10" />
            </Link>
            <p className="text-sidebar-foreground/70 text-sm leading-relaxed mb-6">
              Transformando a forma como clínicas de saúde oferecem crédito aos seus pacientes.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center hover:bg-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center hover:bg-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center hover:bg-primary transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-display font-semibold text-white mb-6">Produto</h4>
            <ul className="space-y-3">
              {['Recursos', 'Planos', 'Integrações', 'API', 'Atualizações'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sidebar-foreground/70 hover:text-white text-sm transition-colors">
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
              {['Sobre nós', 'Carreiras', 'Blog', 'Parceiros', 'Imprensa'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sidebar-foreground/70 hover:text-white text-sm transition-colors">
                    {item}
                  </a>
                </li>
              ))}
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
                <a href="tel:+5511999999999" className="text-sidebar-foreground/70 hover:text-white text-sm transition-colors">
                  (11) 99999-9999
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

        <div className="border-t border-sidebar-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
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
