import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Features = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <h2 id="contact" className="text-3xl md:text-5xl font-display font-bold text-foreground">
            É <span className="gradient-text">simples!</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative w-full overflow-hidden rounded-2xl border border-border shadow-xl aspect-video">
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/mC4WWO1pMV8"
              title="Como funciona o Help Ude"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </motion.div>

        <div className="flex justify-center mt-12">
          <Link to="/cadastroclinica">
            <Button variant="hero" size="lg" className="rounded-full">
              Quero oferecer a HelpUde na minha clínica
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Features;