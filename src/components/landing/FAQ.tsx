import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

const faqs = [
  {
    q: 'O que é a HelpUde? É um plano de saúde?',
    a: 'Não. A HelpUde é uma facilitadora que conecta profissionais da saúde a pacientes que desejam realizar seus tratamentos, mas enfrentam dificuldades com as formas tradicionais de pagamento. Viabilizamos o início do tratamento com um processo ágil, digital e validado pela clínica.',
  },
  {
    q: 'Preciso mudar algo na minha clínica para usar a HelpUde?',
    a: 'Não. A HelpUde foi pensada para se adaptar à sua rotina atual. Você continua atendendo como sempre fez. Nós entramos como apoio, no momento em que o paciente precisa de uma alternativa viável para realizar o tratamento.',
  },
  {
    q: 'Como o paciente acessa a HelpUde?',
    a: 'Basta escanear o QR Code da clínica ou ser encaminhado por você. O atendimento é feito de forma humanizada e rápida via WhatsApp. Coletamos as informações, apresentamos a proposta e guiamos o paciente até a finalização digital.',
  },
  {
    q: 'Quem aprova o início do tratamento?',
    a: 'A clínica. Após a assinatura do paciente, você recebe um aviso no painel da HelpUde. Com um clique, valida o atendimento e pode iniciar o tratamento imediatamente.',
  },
  {
    q: 'Quais profissionais podem utilizar a HelpUde?',
    a: 'Médicos, dentistas, esteticistas e outros profissionais da saúde. Nossa plataforma é preparada para atender diferentes especialidades de forma personalizada.',
  },
  {
    q: 'A clínica recebe o valor antes de iniciar o atendimento?',
    a: 'Sim. Depois que a proposta é aceita e a clínica valida o procedimento, a HelpUde libera imediatamente a autorização para que o tratamento comece com segurança. Tudo é feito sem riscos para o profissional.',
  },
  {
    q: 'O processo é seguro?',
    a: 'Sim, utilizamos tecnologias avançadas para garantir a segurança e confidencialidade das informações de todos os envolvidos.',
  },
  {
    q: 'Há custos para a clínica ao utilizar a HelpUde?',
    a: 'Nossa proposta é oferecer uma parceria vantajosa para ambos os lados. Para detalhes específicos sobre custos e condições, entre em contato conosco.',
  },
];

const FAQ = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground">
            Perguntas
          </h2>
          <p className="text-3xl md:text-5xl font-display font-light gradient-text">
            Frequentes
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-none rounded-full data-[state=open]:rounded-3xl overflow-hidden bg-gradient-to-r from-helpude-teal-light/70 to-helpude-purple-dark"
              >
                <AccordionTrigger className="px-6 py-4 text-left text-white font-semibold hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-5 text-white/90 text-sm leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="flex justify-center mt-10">
            <a
              href="https://wa.me/551151921464"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="hero" size="lg" className="rounded-full gap-2">
                <MessageCircle className="w-5 h-5" />
                Saiba Mais
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;