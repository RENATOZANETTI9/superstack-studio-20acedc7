import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { name: 'Recursos', href: '#features' },
    { name: 'Níveis', href: '#pricing' },
    { name: 'Sobre', href: '#about' },
    { name: 'Contato', href: '#contact' },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-4 mt-4">
        <div
          className={`glass-card rounded-2xl transition-colors duration-300 ${
            scrolled
              ? 'bg-white/90 border-white/40 shadow-lg backdrop-blur-xl'
              : 'bg-white/10 border-white/20'
          }`}
        >
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link to="/" className="flex items-center">
                <img src={logo} alt="HelpUde" className="h-[42px]" />
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-8">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className={`transition-colors text-sm font-medium ${
                      scrolled
                        ? 'text-helpude-purple/80 hover:text-helpude-purple'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    {link.name}
                  </a>
                ))}
              </nav>

              {/* Desktop CTA */}
              <div className="hidden md:flex items-center gap-3">
                <Link to="/auth">
                  <Button
                    variant="ghost"
                    className={`transition-colors ${
                      scrolled
                        ? 'text-helpude-purple hover:bg-helpude-purple/10'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    Entrar
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="hero" size="default">
                    Acessar Sistema
                  </Button>
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <button
                className={`md:hidden p-2 ${scrolled ? 'text-helpude-purple' : 'text-white'}`}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden pt-4 pb-2"
              >
                <nav className="flex flex-col gap-2">
                  {navLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.href}
                      className={`py-2 px-4 rounded-lg transition-colors ${
                        scrolled
                          ? 'text-helpude-purple/80 hover:text-helpude-purple hover:bg-helpude-purple/5'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.name}
                    </a>
                  ))}
                  <div className={`flex flex-col gap-2 mt-4 pt-4 border-t ${scrolled ? 'border-helpude-purple/10' : 'border-white/10'}`}>
                    <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        className={`w-full ${
                          scrolled
                            ? 'text-helpude-purple hover:bg-helpude-purple/10'
                            : 'text-white hover:bg-white/10'
                        }`}
                      >
                        Entrar
                      </Button>
                    </Link>
                    <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="hero" className="w-full">
                        Acessar Sistema
                      </Button>
                    </Link>
                  </div>
                </nav>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
