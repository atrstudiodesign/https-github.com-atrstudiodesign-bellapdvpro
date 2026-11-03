import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { AtrStudioBadge } from '../components/ui/AtrStudioBadge';

const legalData: Record<string, { title: string, content: string }> = {
  'politica-de-privacidade': {
    title: 'Política de Privacidade',
    content: `
      <h2>1. Coleta de Dados</h2>
      <p>Coletamos informações pessoais que você nos fornece voluntariamente ao se registrar no sistema, incluindo nome, endereço de e-mail e informações comerciais.</p>
      <h2>2. Uso das Informações</h2>
      <p>Utilizamos suas informações para fornecer, operar e manter nosso sistema; melhorar e personalizar a experiência do usuário; entender e prever comportamentos.</p>
      <h2>3. Compartilhamento de Dados</h2>
      <p>Não compartilhamos suas informações privadas com terceiros sem sua permissão, exceto para cumprir a lei, proteger nossos direitos ou interagir com parceiros de serviços essenciais.</p>
    `
  },
  'cookies': {
    title: 'Política de Cookies',
    content: `
      <h2>O que são cookies?</h2>
      <p>Cookies são pequenos arquivos de texto armazenados no seu dispositivo. Utilizamos cookies para entender como você usa nosso sistema e melhorar sua experiência.</p>
      <h2>Como usamos os cookies</h2>
      <p>Usamos cookies para autenticar contas, proteger contas, apresentar campanhas direcionadas e analisar o desempenho da nossa plataforma.</p>
    `
  },
  'aviso-legal': {
    title: 'Aviso Legal',
    content: `
      <p>O conteúdo disponibilizado nesta plataforma tem finalidade puramente informativa e gerencial. Não garantimos que a plataforma estará sempre livre de erros ou interrupções.</p>
    `
  },
  'termos-de-uso': {
    title: 'Termos de Uso',
    content: `<h2>Condições comerciais</h2><p>O Bella PDV Pro Completo oferece duas modalidades para novas contratações: fidelidade de 12 meses a R$ 39,90/mês (12 mensalidades; total de R$ 478,80) e mensalidade sem fidelidade de R$ 89,90/mês. Os recursos anunciados são os mesmos em ambas as modalidades.</p><h2>Teste gratuito</h2><p>O teste anunciado de 15 dias pode ser iniciado sem cartão. O cadastro gratuito não gera cobrança nem adesão automática a qualquer plano. A contratação paga depende de aceite expresso.</p><h2>Fidelidade e cancelamento</h2><p>As condições de rescisão antecipada do plano de 12 meses, inclusive eventual multa e cálculo, devem ser exibidas de forma destacada antes do aceite. O plano sem fidelidade não exige permanência mínima. Aplicam-se os direitos legais de cancelamento.</p><h2>Assinaturas anteriores</h2><p>Contratos e cobranças existentes não são alterados automaticamente pela nova oferta.</p>`
  },
  'politica-de-promocoes': {
    title: 'Política de Promoções e Assinaturas',
    content: `<h2>Fidelidade de 12 meses</h2><p>R$ 39,90/mês por 12 meses, total R$ 478,80. Condições de rescisão antecipada devem ser apresentadas antes da contratação.</p><h2>Sem fidelidade</h2><p>R$ 89,90/mês, sem compromisso mínimo de permanência.</p><h2>Teste de 15 dias</h2><p>O teste gratuito anunciado dispensa cartão e não constitui adesão automática a uma assinatura paga.</p><h2>Contratos existentes</h2><p>Novas ofertas não modificam assinaturas anteriores sem concordância do titular.</p>`
  },
  'politica-de-cadastros': {
    title: 'Política de Cadastros e Serviços',
    content: `
      <p>Todos os cadastros realizados na plataforma devem conter informações verdadeiras e atualizadas. Reservamo-nos o direito de suspender contas que infrinjam essa regra.</p>
    `
  },
  'politica-de-pagamentos': {
    title: 'Política de Pagamentos',
    content: `<p>Novas ofertas: Bella PDV Pro Completo com fidelidade de 12 meses por R$ 39,90/mês (total de R$ 478,80) ou mensal sem fidelidade por R$ 89,90/mês. A antiga promoção de R$ 29,90 nos três primeiros meses não se aplica às novas contratações.</p><p>Valor final, vencimento, meio de pagamento, início da cobrança e eventual renovação devem ser informados antes do aceite. O cadastro gratuito não autoriza cobrança. Atrasos serão tratados conforme o contrato e a legislação, com comunicação adequada.</p>`
  },
  'politicas-de-uso': {
    title: 'Políticas de Uso',
    content: `
      <p>O usuário se compromete a fazer uso adequado dos conteúdos e serviços que a plataforma oferece, não os utilizando para atividades ilícitas ou contrárias à boa fé.</p>
    `
  },
  'copyright': {
    title: 'Copyright do Sistema',
    content: `
      <p>© ${new Date().getFullYear()} Bella PDV. Todos os direitos reservados. Desenvolvido por <a href="https://atrstudio.com.br" target="_blank" rel="noopener noreferrer" class="text-cyan-400 underline font-semibold">ATR Studio Design</a>. O software, design, logos e propriedades intelectuais são protegidos por lei.</p>
    `
  },
  'quem-somos': {
    title: 'Quem Somos',
    content: `
      <p>Somos uma plataforma inovadora criada para revolucionar a gestão de estabelecimentos. Nosso objetivo é automatizar seu negócio para você focar no que realmente importa.</p>
    `
  },
  'contato': {
    title: 'Contato',
    content: `
      <p>Preencha nosso formulário de atendimento no painel ou envie um email diretamente para <strong>atrstudiodesign@gmail.com</strong>. Para atendimento direto, <a href="https://wa.me/5511939026928?text=Ol%C3%A1%21%20Preciso%20de%20suporte%20com%20o%20Bella%20PDV%20Pro." target="_blank" rel="noopener noreferrer">fale com a ATR Studio pelo WhatsApp (11) 93902-6928</a>.</p>
    `
  },
  'suporte': {
    title: 'Suporte',
    content: `
      <p>Para abrir um ticket de suporte, abra o menu interno da plataforma. Você também pode conversar com nossa Inteligência Artificial para soluções imediatas.</p>
    `
  },
  'como-usar': {
    title: 'Como Usar',
    content: `
      <p>O sistema foi desenhado de forma intuitiva. Caso seja sua primeira vez, consulte o <a href="/ajuda/como-usar">guia de primeiros passos</a> e a <a href="/ajuda">Central de Ajuda</a> para tutoriais por módulo.</p>
    `
  },
  'lgpd': {
    title: 'Lei LGPD',
    content: `
      <h2>Adequação à LGPD</h2>
      <p>Respeitamos a Lei Geral de Proteção de Dados (13.709/2018). Você tem o direito de solicitar, a qualquer momento, e de forma gratuita e facilitada, o acesso aos seus dados e a portabilidade ou exclusão.</p>
    `
  },
  'formas-de-pagamento': {
    title: 'Formas de Pagamento',
    content: `<p>Os meios de pagamento efetivamente disponíveis serão informados antes da contratação. O início do teste grátis ou o cadastro gratuito de empresa não cria uma assinatura paga. A cobrança automática depende de integração homologada e consentimento expresso.</p>`
  },
  'reembolso': {
    title: 'Política de Reembolso e Cancelamento',
    content: `<p>Nas contratações fora do estabelecimento comercial, aplica-se o direito de arrependimento previsto no art. 49 do Código de Defesa do Consumidor, quando cabível, dentro do prazo legal de sete dias. Outros reembolsos e cancelamentos observam os direitos legais e as condições contratuais válidas.</p><p>O plano de R$ 89,90/mês não exige fidelidade. Para o plano de R$ 39,90/mês, eventual multa por rescisão antecipada somente poderá ser exigida quando validamente prevista, informada antes da contratação e compatível com a legislação.</p>`
  }
};

export default function Legal() {
  const { page } = useParams();
  
  const content = page ? legalData[page] : null;

  if (!content) {
    return (
      <div className="min-h-screen bg-[#05070F] text-white flex flex-col items-center justify-center p-6">
        <h1 className="text-4xl font-bold mb-4">Página não encontrada</h1>
        <Link to="/" className="text-blue-500 hover:text-blue-400">Voltar ao início</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070F] text-slate-300 font-sans">
      <div className="max-w-4xl mx-auto py-12 px-6">
        <Link to="/" className="flex items-center gap-2 text-blue-500 hover:text-blue-400 mb-8 transition-colors inline-flex">
          <ArrowLeft className="w-5 h-5" />
          Voltar para o sistema
        </Link>
        
        <div className="bg-[#0A0F1F] border border-blue-500/20 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Shield className="w-32 h-32" />
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-8 tracking-tight relative z-10">
            {content.title}
          </h1>
          
          <div 
            className="prose prose-invert prose-blue max-w-none relative z-10
              prose-h2:text-2xl prose-h2:text-white prose-h2:mt-8 prose-h2:mb-4
              prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-4
              prose-strong:text-white prose-strong:font-bold"
            dangerouslySetInnerHTML={{ __html: content.content }}
          />

          <div className="mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} BellaPDV. Todos os direitos reservados.</p>
            <AtrStudioBadge size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
