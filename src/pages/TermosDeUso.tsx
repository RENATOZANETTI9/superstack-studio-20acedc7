import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TermosDeUso = () => {
  return (
    <div className="min-h-screen gradient-hero text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8 text-white/80 hover:text-white hover:bg-white/10">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">Termos de Uso</h1>
        <p className="text-white/60 mb-8">Última atualização: 10 de março de 2026</p>

        <div className="prose prose-lg max-w-none text-white/90 space-y-6">
          <section>
            <h2 className="text-xl font-display font-semibold text-white mt-8 mb-3">1. Identificação da Empresa</h2>
            <p>A plataforma HelpUde é de propriedade e operada por <strong>R2A Soluções LTDA</strong>, inscrita no CNPJ/MF sob o nº 20.451.457/0001-20.</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Matriz:</strong> Alameda Salvador, Edifício Salvador Shopping Business, Torre Europa, Sala 1818, Caminho das Árvores, Salvador – Bahia. CEP: 41820-790.</li>
              <li><strong>Filial:</strong> Avenida Paulista 1106, Andar 16 - Bela Vista - São Paulo SP - CEP: 01310-914.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-white mt-8 mb-3">2. Aceitação dos Termos</h2>
            <p>Ao acessar e utilizar a plataforma HelpUde, você declara que leu, compreendeu e concorda integralmente com estes Termos de Uso. Caso não concorde com qualquer disposição, solicitamos que não utilize nossos serviços.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-white mt-8 mb-3">3. Descrição do Serviço</h2>
            <p>A HelpUde é uma Healthtech que oferece serviço 100% digital, não é uma instituição financeira e não realiza operações de crédito diretamente. A plataforma atua como correspondente bancário, seguindo as diretrizes do Banco Central do Brasil, nos termos da Resolução CMN 4.935/2021, do BACEN.</p>
            <p>Toda avaliação de crédito será realizada conforme a política de crédito da Instituição Financeira escolhida pelo usuário. Antes da contratação de qualquer serviço através de nossos parceiros, você receberá todas as condições e informações relativas ao produto a ser contratado, de forma completa e transparente.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-white mt-8 mb-3">4. Cadastro e Conta do Usuário</h2>
            <p>Para utilizar determinados serviços da plataforma, poderá ser necessário o cadastro, devendo o usuário fornecer informações verdadeiras, completas e atualizadas. O usuário é responsável pela confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-white mt-8 mb-3">5. Obrigações do Usuário</h2>
            <p>O usuário compromete-se a:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Utilizar a plataforma apenas para fins lícitos e de acordo com a legislação vigente;</li>
              <li>Não reproduzir, duplicar, copiar ou explorar comercialmente qualquer conteúdo da plataforma sem autorização prévia;</li>
              <li>Não tentar acessar áreas restritas ou interferir no funcionamento da plataforma;</li>
              <li>Fornecer informações verídicas e mantê-las atualizadas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-white mt-8 mb-3">6. Propriedade Intelectual</h2>
            <p>Todo o conteúdo da plataforma HelpUde, incluindo, mas não se limitando a, textos, imagens, logotipos, marcas, layouts e software, é de propriedade exclusiva da R2A Soluções LTDA ou de seus licenciadores, sendo protegido pelas leis brasileiras de propriedade intelectual.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-white mt-8 mb-3">7. Limitação de Responsabilidade</h2>
            <p>A HelpUde não se responsabiliza por:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Decisões de crédito tomadas pelas instituições financeiras parceiras;</li>
              <li>Interrupções temporárias no acesso à plataforma por motivos técnicos ou de manutenção;</li>
              <li>Danos decorrentes de uso indevido da plataforma pelo usuário;</li>
              <li>Conteúdo de sites de terceiros acessados por meio de links disponibilizados na plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-white mt-8 mb-3">8. Modificações dos Termos</h2>
            <p>A HelpUde reserva-se o direito de alterar estes Termos de Uso a qualquer momento, mediante publicação da versão atualizada na plataforma. O uso continuado dos serviços após a publicação das alterações implica aceitação dos novos termos.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-white mt-8 mb-3">9. Legislação Aplicável e Foro</h2>
            <p>Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Fica eleito o Foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias decorrentes destes Termos, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-white mt-8 mb-3">10. Contato</h2>
            <p>Em caso de dúvidas sobre estes Termos de Uso, entre em contato conosco:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>E-mail:</strong> contato@helpude.com.br</li>
              <li><strong>WhatsApp:</strong> (11) 5192-1464</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermosDeUso;
