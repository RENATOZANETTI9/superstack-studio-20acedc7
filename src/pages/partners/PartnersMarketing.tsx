import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, FileImage, ExternalLink, Clock, Eye } from 'lucide-react';

const VIDEO_SECTIONS = [
  {
    title: 'Jornada da Clínica',
    description: 'Vídeos de como a clínica utiliza o sistema Help Ude no dia a dia.',
    videos: [
      { title: 'Como a clínica usa a Help Ude', duration: '5:32', views: 1240, thumbnail: '🏥', description: 'Visão geral do sistema para a clínica — do primeiro acesso até a operação diária.' },
      { title: 'Como cadastrar pacientes', duration: '3:18', views: 890, thumbnail: '📝', description: 'Passo a passo para cadastrar pacientes e iniciar consultas de crédito.' },
      { title: 'Como acompanhar propostas', duration: '4:45', views: 720, thumbnail: '📊', description: 'Acompanhe o status de cada proposta no pipeline de aprovação.' },
      { title: 'Como gerar link de assinatura', duration: '2:55', views: 650, thumbnail: '🔗', description: 'Geração e envio do link de assinatura digital para o paciente.' },
      { title: 'Como usar gatilhos de marketing', duration: '6:10', views: 580, thumbnail: '📣', description: 'Configure SMS, e-mail e IA para aumentar a conversão de contratos.' },
      { title: 'Dashboard e métricas da clínica', duration: '4:20', views: 510, thumbnail: '📈', description: 'Entenda os indicadores de performance e tome decisões melhores.' },
    ],
  },
  {
    title: 'Cadastro de Partners',
    description: 'Vídeos sobre como recrutar e gerenciar sua rede de parceiros.',
    videos: [
      { title: 'Como cadastrar um novo Partner', duration: '3:45', views: 430, thumbnail: '🤝', description: 'Aprenda a gerar seu link de indicação e recrutar novos parceiros para sua rede.' },
      { title: 'Como funciona a rede de indicação', duration: '5:15', views: 380, thumbnail: '🌐', description: 'Entenda a hierarquia Master Partner → Partner e como o override funciona.' },
      { title: 'Como acompanhar sua rede', duration: '4:00', views: 320, thumbnail: '👥', description: 'Monitore a produtividade dos partners indicados e suas clínicas.' },
      { title: 'Bonificações e comissões', duration: '6:30', views: 290, thumbnail: '💰', description: 'Conheça todos os tipos de bonificação: direta, override, mimos e PIX mensal.' },
    ],
  },
];

const CARD_SECTIONS = [
  {
    title: 'Material para Clínicas',
    description: 'Cards e materiais visuais para compartilhar com suas clínicas.',
    cards: [
      { title: 'Banner — Como funciona a Help Ude', type: 'Banner', format: 'PNG 1200x628', emoji: '🖼️', description: 'Banner explicativo para redes sociais da clínica.' },
      { title: 'Flyer — Benefícios para o Paciente', type: 'Flyer', format: 'PDF A4', emoji: '📄', description: 'Material para impressão com os benefícios do crédito saúde.' },
      { title: 'Post Instagram — Crédito Saúde', type: 'Post', format: 'PNG 1080x1080', emoji: '📱', description: 'Post pronto para Instagram da clínica divulgar o serviço.' },
      { title: 'Stories — Passo a Passo', type: 'Stories', format: 'PNG 1080x1920', emoji: '📲', description: 'Sequência de stories explicando o processo para o paciente.' },
      { title: 'Apresentação Comercial', type: 'Apresentação', format: 'PDF 16:9', emoji: '📊', description: 'Apresentação profissional para reuniões com clínicas.' },
    ],
  },
  {
    title: 'Material para Partners',
    description: 'Cards e materiais para recrutar e engajar novos parceiros.',
    cards: [
      { title: 'Banner — Seja um Partner Help Ude', type: 'Banner', format: 'PNG 1200x628', emoji: '🤝', description: 'Banner para redes sociais convidando novos parceiros.' },
      { title: 'Flyer — Programa de Partners', type: 'Flyer', format: 'PDF A4', emoji: '📋', description: 'Material detalhado sobre o programa de parceria.' },
      { title: 'Infográfico — Ganhos do Partner', type: 'Infográfico', format: 'PNG 1080x1920', emoji: '💎', description: 'Infográfico mostrando as faixas de ganho e benefícios.' },
      { title: 'E-mail Template — Convite', type: 'E-mail', format: 'HTML', emoji: '✉️', description: 'Template de e-mail para convidar potenciais parceiros.' },
    ],
  },
];

const PartnersMarketing = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marketing</h1>
          <p className="text-muted-foreground">Materiais de apoio para Partners e Clínicas — vídeos, cards e conteúdo pronto para usar.</p>
        </div>

        <Tabs defaultValue="videos">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="videos" className="text-xs sm:text-sm">🎬 Vídeos</TabsTrigger>
            <TabsTrigger value="cards" className="text-xs sm:text-sm">🖼️ Cards e Materiais</TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="space-y-8 mt-4">
            {VIDEO_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.videos.map((video) => (
                    <Card key={video.title} className="group hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-0">
                        <div className="relative bg-muted rounded-t-lg flex items-center justify-center h-36">
                          <span className="text-5xl">{video.thumbnail}</span>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-t-lg flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground rounded-full p-3">
                              <Play className="h-5 w-5" />
                            </div>
                          </div>
                        </div>
                        <div className="p-4 space-y-2">
                          <h3 className="font-medium text-sm leading-tight">{video.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">{video.description}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{video.duration}</span>
                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{video.views}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="cards" className="space-y-8 mt-4">
            {CARD_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.cards.map((card) => (
                    <Card key={card.title} className="group hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-0">
                        <div className="relative bg-muted rounded-t-lg flex items-center justify-center h-28">
                          <span className="text-4xl">{card.emoji}</span>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-t-lg flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground rounded-full p-2">
                              <ExternalLink className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                        <div className="p-4 space-y-2">
                          <h3 className="font-medium text-sm leading-tight">{card.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">{card.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">{card.type}</Badge>
                            <Badge variant="secondary" className="text-[10px]">{card.format}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PartnersMarketing;
