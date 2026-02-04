/**
 * Terms of Service Page
 * 
 * Legal terms and conditions for using the ISOTEC contract system.
 * 
 * Requirements: 11.6
 */

import { Metadata } from 'next/metadata';

export const metadata: Metadata = {
  title: 'Termos de Uso | ISOTEC',
  description: 'Termos e condições de uso do sistema de contratos ISOTEC',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Termos de Uso
        </h1>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Aceitação dos Termos
            </h2>
            <p className="text-gray-700">
              Ao utilizar o sistema de contratos da ISOTEC, você concorda com estes Termos de Uso.
              Se você não concordar com qualquer parte destes termos, não utilize o sistema.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Descrição do Serviço
            </h2>
            <p className="text-gray-700">
              O sistema de contratos ISOTEC é uma plataforma digital para criação, visualização e
              assinatura de contratos de instalação de sistemas fotovoltaicos. O serviço inclui:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Criação de contratos por administradores autorizados</li>
              <li>Visualização pública de contratos através de URLs únicas</li>
              <li>Assinatura digital via GOV.BR ou verificação por e-mail</li>
              <li>Geração de documentos PDF</li>
              <li>Registro de auditoria de assinaturas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. Elegibilidade
            </h2>
            <p className="text-gray-700">
              Para utilizar este serviço, você deve:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Ter capacidade legal para celebrar contratos</li>
              <li>Fornecer informações verdadeiras e precisas</li>
              <li>Possuir um CPF válido</li>
              <li>Ter acesso a um endereço de e-mail válido (para assinatura por e-mail)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Assinatura Digital
            </h2>
            <p className="text-gray-700 mb-2">
              O sistema oferece dois métodos de assinatura digital:
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">
              4.1 Assinatura Avançada (GOV.BR)
            </h3>
            <p className="text-gray-700">
              Utiliza autenticação via GOV.BR OAuth, em conformidade com a MP 2.200-2/2001.
              Esta assinatura possui validade jurídica equivalente à assinatura manuscrita.
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">
              4.2 Assinatura Admitida (E-mail)
            </h3>
            <p className="text-gray-700">
              Utiliza verificação por código enviado ao e-mail, em conformidade com a Lei 14.063/2020.
              Esta assinatura é válida para contratos entre particulares e empresas privadas.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Integridade do Contrato
            </h2>
            <p className="text-gray-700">
              Todos os contratos assinados são protegidos por hash criptográfico SHA-256.
              Qualquer alteração no conteúdo do contrato após a assinatura será detectada
              e invalidará a verificação de integridade.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Responsabilidades do Usuário
            </h2>
            <p className="text-gray-700 mb-2">
              Ao utilizar o sistema, você concorda em:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Fornecer informações verdadeiras e precisas</li>
              <li>Manter a confidencialidade de códigos de verificação</li>
              <li>Não compartilhar URLs de contratos com terceiros não autorizados</li>
              <li>Notificar imediatamente sobre qualquer uso não autorizado</li>
              <li>Não tentar acessar áreas restritas do sistema</li>
              <li>Não realizar ataques ou tentativas de comprometer a segurança</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Propriedade Intelectual
            </h2>
            <p className="text-gray-700">
              Todo o conteúdo, design, código e funcionalidades do sistema são propriedade
              exclusiva da ISOTEC e estão protegidos por leis de direitos autorais e propriedade
              intelectual.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Limitação de Responsabilidade
            </h2>
            <p className="text-gray-700">
              A ISOTEC não se responsabiliza por:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Interrupções temporárias do serviço para manutenção</li>
              <li>Falhas em serviços de terceiros (GOV.BR, ViaCEP, Google Maps)</li>
              <li>Perda de dados devido a falhas de hardware ou software</li>
              <li>Uso indevido do sistema por terceiros</li>
            </ul>
            <p className="text-gray-700 mt-2">
              O sistema é fornecido "como está", sem garantias expressas ou implícitas.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Privacidade e Proteção de Dados
            </h2>
            <p className="text-gray-700">
              O tratamento de dados pessoais é regido pela nossa{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">
                Política de Privacidade
              </a>
              , em conformidade com a LGPD.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Modificações nos Termos
            </h2>
            <p className="text-gray-700">
              A ISOTEC reserva-se o direito de modificar estes termos a qualquer momento.
              Alterações significativas serão comunicadas por e-mail ou através de aviso no sistema.
              O uso continuado do sistema após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              11. Rescisão
            </h2>
            <p className="text-gray-700">
              A ISOTEC pode suspender ou encerrar o acesso ao sistema em caso de violação
              destes termos, sem aviso prévio. Contratos já assinados permanecerão válidos
              e acessíveis conforme obrigações legais.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              12. Lei Aplicável e Foro
            </h2>
            <p className="text-gray-700">
              Estes termos são regidos pelas leis da República Federativa do Brasil.
              Qualquer disputa será resolvida no foro da comarca da sede da ISOTEC.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              13. Contato
            </h2>
            <p className="text-gray-700">
              Para questões sobre estes termos, entre em contato:
            </p>
            <p className="text-gray-700 mt-2">
              E-mail:{' '}
              <a href="mailto:contato@isotec.com.br" className="text-blue-600 hover:underline">
                contato@isotec.com.br
              </a>
            </p>
          </section>

          <section className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
            </p>
            <p className="text-gray-600 text-sm mt-2">
              <strong>Versão:</strong> 1.0
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
