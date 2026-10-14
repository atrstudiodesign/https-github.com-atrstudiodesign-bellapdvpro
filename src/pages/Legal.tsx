import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

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
    content: `
      <h2>1. Aceitação dos Termos</h2>
      <p>Ao acessar e usar nossa plataforma, você concorda em cumprir e estar vinculado a estes Termos de Uso.</p>
      <h2>2. Licença de Uso</h2>
      <p>Concedemos a você uma licença limitada, não exclusiva e intransferível para usar nossa plataforma de acordo com estes termos.</p>
    `
  },
  'politica-de-cadastros': {
    title: 'Política de Cadastros e Serviços',
    content: `
      <p>Todos os cadastros realizados na plataforma devem conter informações verdadeiras e atualizadas. Reservamo-nos o direito de suspender contas que infrinjam essa regra.</p>
    `
  },
  'politica-de-pagamentos': {
    title: 'Política de Pagamentos',
    content: `
      <p>Os pagamentos pelos serviços prestados devem ser efetuados conforme as datas de vencimento acordadas. A falta de pagamento suspenderá o acesso às funcionalidades premium.</p>
    `
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
      <p>Preencha nosso formulário de atendimento no painel ou envie um email diretamente para <strong>suporte@bellapdv.com</strong>. Nosso tempo de resposta é de até 2 horas úteis.</p>
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
      <p>O sistema foi desenhado de forma intuitiva. Caso seja sua primeira vez, acesse a página de Tutoriais no seu Dashboard para vídeos explicativos passo-a-passo e dicas de configuração da IA.</p>
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
    title: 'Formas de Pagamentos',
    content: `
      <p>Aceitamos Pix, Cartão de Crédito e Boleto Bancário. As assinaturas são renovadas automaticamente, mas você pode cancelar a qualquer momento no seu Painel de Faturas.</p>
    `
  },
  'reembolso': {
    title: 'Política de Reembolso',
    content: `
      <p>Garantimos a devolução integral (100%) do valor pago caso você solicite o cancelamento nos primeiros 7 dias após a compra, conforme o Art. 49 do CDC. Após esse prazo, não há devoluções, apenas o cancelamento da renovação.</p>
    `
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
        </div>
      </div>
    </div>
  );
}
