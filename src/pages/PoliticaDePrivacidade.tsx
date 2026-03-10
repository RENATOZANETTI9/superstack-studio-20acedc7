import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PoliticaDePrivacidade = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">Política de Privacidade</h1>
        <p className="text-muted-foreground mb-8">Última atualização: 10 de março de 2026</p>

        <div className="prose prose-lg max-w-none text-foreground/90 space-y-6">
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mt-8 mb-3">1. Introdução</h2>
            <p>A <strong>R2A Soluções LTDA</strong> (CNPJ: 20.451.457/0001-20), proprietária da plataforma HelpUde, está comprometida com a proteção da privacidade e dos dados pessoais de seus usuários, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD – Lei nº 13.709/2018) e demais normas aplicáveis.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mt-8 mb-3">2. Dados Pessoais Coletados</h2>
            <p>Podemos coletar os seguintes dados pessoais:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Dados de identificação:</strong> nome completo, CPF, RG, data de nascimento;</li>
              <li><strong>Dados de contato:</strong> e-mail, telefone, endereço;</li>
              <li><strong>Dados financeiros:</strong> informações bancárias e de crédito necessárias para a análise e operação de crédito;</li>
              <li><strong>Dados de navegação:</strong> endereço IP, tipo de navegador, páginas visitadas, tempo de permanência, cookies;</li>
              <li><strong>Dados de dispositivo:</strong> modelo do aparelho, sistema operacional, identificadores únicos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mt-8 mb-3">3. Finalidade do Tratamento</h2>
            <p>Os dados pessoais coletados são utilizados para as seguintes finalidades:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Viabilizar a prestação dos serviços oferecidos pela plataforma;</li>
              <li>Realizar análise de crédito junto às instituições financeiras parceiras;</li>
              <li>Cumprir obrigações legais e regulatórias;</li>
              <li>Personalizar a experiência do usuário na plataforma;</li>
              <li>Enviar comunicações relacionadas aos serviços contratados;</li>
              <li>Melhorar nossos produtos e serviços;</li>
              <li>Prevenir fraudes e garantir a segurança da plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mt-8 mb-3">4. Base Legal para o Tratamento</h2>
            <p>O tratamento de dados pessoais é realizado com base nas seguintes hipóteses legais previstas na LGPD:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Consentimento do titular (Art. 7º, I);</li>
              <li>Cumprimento de obrigação legal ou regulatória (Art. 7º, II);</li>
              <li>Execução de contrato ou procedimentos preliminares (Art. 7º, V);</li>
              <li>Exercício regular de direitos (Art. 7º, VI);</li>
              <li>Legítimo interesse do controlador (Art. 7º, IX).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mt-8 mb-3">5. Compartilhamento de Dados</h2>
            <p>Os dados pessoais poderão ser compartilhados com:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Instituições financeiras parceiras:</strong> para análise e concessão de crédito;</li>
              <li><strong>Prestadores de serviços:</strong> empresas contratadas para suporte operacional, tecnológico e de marketing;</li>
              <li><strong>Autoridades públicas:</strong> quando exigido por lei ou regulamentação;</li>
              <li><strong>Plataformas de publicidade:</strong> dados anonimizados para fins de marketing (Google Ads, Meta Ads).</li>
            </ul>
            <p>Não comercializamos dados pessoais de nossos usuários.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mt-8 mb-3">6. Cookies e Tecnologias de Rastreamento</h2>
            <p>Utilizamos cookies e tecnologias similares para:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Garantir o funcionamento adequado da plataforma;</li>
              <li>Analisar o tráfego e o comportamento dos usuários;</li>
              <li>Personalizar conteúdo e anúncios;</li>
              <li>Medir a eficácia de campanhas publicitárias.</li>
            </ul>
            <p>Você pode gerenciar suas preferências de cookies através das configurações do seu navegador.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mt-8 mb-3">7. Armazenamento e Segurança</h2>
            <p>Os dados pessoais são armazenados em servidores seguros, com adoção de medidas técnicas e administrativas adequadas para proteger contra acessos não autorizados, destruição, perda, alteração ou qualquer forma de tratamento inadequado.</p>
            <p>Os dados são retidos pelo tempo necessário para cumprir as finalidades para as quais foram coletados, respeitando os prazos legais aplicáveis.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mt-8 mb-3">8. Direitos do Titular</h2>
            <p>De acordo com a LGPD, você tem direito a:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Confirmação da existência de tratamento de dados;</li>
              <li>Acesso aos dados pessoais;</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários;</li>
              <li>Portabilidade dos dados;</li>
              <li>Eliminação dos dados tratados com consentimento;</li>
              <li>Informação sobre compartilhamento de dados;</li>
              <li>Revogação do consentimento.</li>
            </ul>
            <p>Para exercer seus direitos, entre em contato pelo e-mail: <strong>contato@helpude.com.br</strong>.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mt-8 mb-3">9. Transferência Internacional de Dados</h2>
            <p>Seus dados pessoais poderão ser transferidos para servidores localizados fora do Brasil, sempre em conformidade com a LGPD e mediante a adoção de garantias adequadas de proteção.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mt-8 mb-3">10. Alterações nesta Política</h2>
            <p>Esta Política de Privacidade poderá ser atualizada periodicamente. Recomendamos que você a consulte regularmente. Alterações significativas serão comunicadas através da plataforma.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mt-8 mb-3">11. Encarregado de Proteção de Dados (DPO)</h2>
            <p>Para questões relacionadas à proteção de dados pessoais, entre em contato com nosso Encarregado:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>E-mail:</strong> contato@helpude.com.br</li>
              <li><strong>WhatsApp:</strong> (11) 5192-1464</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mt-8 mb-3">12. Legislação Aplicável</h2>
            <p>Esta Política de Privacidade é regida pela legislação brasileira, em especial pela Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018). Fica eleito o Foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PoliticaDePrivacidade;
