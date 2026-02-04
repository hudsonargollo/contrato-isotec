/**
 * Privacy Policy Page
 * 
 * LGPD-compliant privacy policy explaining data collection,
 * processing, storage, and user rights.
 * 
 * Requirements: 11.6
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade | ISOTEC',
  description: 'Política de privacidade e proteção de dados da ISOTEC',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Política de Privacidade
        </h1>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Introdução
            </h2>
            <p className="text-gray-700">
              A ISOTEC está comprometida com a proteção da privacidade e dos dados pessoais
              de seus clientes, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              Esta política descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Dados Coletados
            </h2>
            <p className="text-gray-700 mb-2">
              Coletamos os seguintes dados pessoais para a execução de contratos de instalação fotovoltaica:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Nome completo</li>
              <li>CPF (Cadastro de Pessoas Físicas)</li>
              <li>Endereço de instalação (CEP, rua, número, bairro, cidade, estado)</li>
              <li>Coordenadas geográficas (latitude e longitude) - opcional</li>
              <li>E-mail e telefone - opcional</li>
              <li>Especificações do projeto (capacidade kWp, data de instalação)</li>
              <li>Informações financeiras (valor do contrato, método de pagamento)</li>
              <li>Endereço IP e data/hora de assinatura digital</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. Finalidade do Tratamento
            </h2>
            <p className="text-gray-700 mb-2">
              Seus dados pessoais são utilizados exclusivamente para:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Elaboração e execução de contratos de serviço</li>
              <li>Identificação e autenticação de partes contratantes</li>
              <li>Assinatura digital de contratos</li>
              <li>Geração de documentos contratuais em PDF</li>
              <li>Cumprimento de obrigações legais e regulatórias</li>
              <li>Auditoria e registro de eventos de assinatura</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Base Legal
            </h2>
            <p className="text-gray-700">
              O tratamento de dados pessoais pela ISOTEC está fundamentado nas seguintes bases legais
              previstas no Art. 7º da LGPD:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Execução de contrato (Art. 7º, V)</li>
              <li>Cumprimento de obrigação legal ou regulatória (Art. 7º, II)</li>
              <li>Exercício regular de direitos em processo judicial, administrativo ou arbitral (Art. 7º, VI)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Compartilhamento de Dados
            </h2>
            <p className="text-gray-700 mb-2">
              Seus dados podem ser compartilhados com:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Provedores de serviços de infraestrutura (Vercel, Supabase)</li>
              <li>Serviços de autenticação (GOV.BR)</li>
              <li>APIs de terceiros (ViaCEP, Google Maps) - apenas para validação de endereços</li>
              <li>Autoridades governamentais, quando exigido por lei</li>
            </ul>
            <p className="text-gray-700 mt-2">
              Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Armazenamento e Segurança
            </h2>
            <p className="text-gray-700">
              Seus dados são armazenados em servidores seguros com as seguintes medidas de proteção:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Criptografia TLS 1.3 para dados em trânsito</li>
              <li>Criptografia AES-256 para dados em repouso</li>
              <li>Controle de acesso baseado em funções (RBAC)</li>
              <li>Autenticação multifator para administradores</li>
              <li>Logs de auditoria imutáveis</li>
              <li>Backups regulares e recuperação de desastres</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Retenção de Dados
            </h2>
            <p className="text-gray-700">
              Os dados pessoais são mantidos pelo período necessário para:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Cumprimento de obrigações contratuais</li>
              <li>Atendimento a requisitos legais e regulatórios (mínimo de 5 anos após assinatura)</li>
              <li>Exercício regular de direitos em processos judiciais</li>
            </ul>
            <p className="text-gray-700 mt-2">
              Após o período de retenção, os dados são anonimizados ou excluídos de forma segura.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Seus Direitos (Art. 18 da LGPD)
            </h2>
            <p className="text-gray-700 mb-2">
              Você tem os seguintes direitos em relação aos seus dados pessoais:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Confirmação da existência de tratamento</li>
              <li>Acesso aos dados</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Portabilidade dos dados a outro fornecedor</li>
              <li>Eliminação dos dados tratados com consentimento</li>
              <li>Informação sobre compartilhamento de dados</li>
              <li>Revogação do consentimento</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Para exercer seus direitos, entre em contato através do e-mail:{' '}
              <a href="mailto:privacidade@isotec.com.br" className="text-blue-600 hover:underline">
                privacidade@isotec.com.br
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Exportação de Dados
            </h2>
            <p className="text-gray-700">
              Você pode solicitar a exportação de todos os seus dados pessoais em formato JSON
              através da página de{' '}
              <a href="/data-export" className="text-blue-600 hover:underline">
                exportação de dados
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Encarregado de Dados (DPO)
            </h2>
            <p className="text-gray-700">
              Para questões relacionadas à proteção de dados pessoais, entre em contato com nosso
              Encarregado de Proteção de Dados:
            </p>
            <p className="text-gray-700 mt-2">
              E-mail:{' '}
              <a href="mailto:dpo@isotec.com.br" className="text-blue-600 hover:underline">
                dpo@isotec.com.br
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              11. Alterações nesta Política
            </h2>
            <p className="text-gray-700">
              Esta política pode ser atualizada periodicamente. A versão mais recente estará sempre
              disponível nesta página. Alterações significativas serão comunicadas por e-mail aos
              titulares de dados.
            </p>
            <p className="text-gray-700 mt-2">
              <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              12. Autoridade Nacional de Proteção de Dados (ANPD)
            </h2>
            <p className="text-gray-700">
              Em caso de dúvidas ou reclamações não resolvidas, você pode contatar a ANPD:
            </p>
            <p className="text-gray-700 mt-2">
              Website:{' '}
              <a
                href="https://www.gov.br/anpd"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                www.gov.br/anpd
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
