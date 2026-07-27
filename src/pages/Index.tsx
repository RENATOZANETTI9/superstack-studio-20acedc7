import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import FAQ from '@/components/landing/FAQ';
import Footer from '@/components/landing/Footer';
import FloatingCTA from '@/components/landing/FloatingCTA';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <section id="hero">
          <Hero />
        </section>
        <section id="features">
          <Features />
        </section>
        <section id="pricing">
          <FAQ />
        </section>
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  );
};

export default Index;
