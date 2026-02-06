/**
 * Data Export Page
 * 
 * Allows contractors to export their personal data in compliance with
 * LGPD Article 18 (right to data portability).
 * 
 * Requirements: 11.6
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCPF, validateCPF } from '@/lib/validation/cpf';

// Client component for data export

export default function DataExportPage() {
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatCPF(value);
    setCpf(formatted);
    setError('');
    setSuccess(false);
  };

  const handleExport = async () => {
    // Validate CPF
    if (!validateCPF(cpf)) {
      setError('CPF inválido. Por favor, verifique o número digitado.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/data-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao exportar dados');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dados-pessoais-${cpf.replace(/\D/g, '')}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar dados');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Exportação de Dados Pessoais</CardTitle>
            <CardDescription>
              Em conformidade com a LGPD (Lei Geral de Proteção de Dados), você tem o direito
              de solicitar uma cópia de todos os seus dados pessoais armazenados em nosso sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCPFChange}
                maxLength={14}
                disabled={loading}
              />
              <p className="text-sm text-gray-500">
                Digite seu CPF para exportar todos os seus dados pessoais.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  Dados exportados com sucesso! O arquivo foi baixado para o seu dispositivo.
                </p>
              </div>
            )}

            <Button
              onClick={handleExport}
              disabled={loading || !cpf}
              className="w-full"
            >
              {loading ? 'Exportando...' : 'Exportar Meus Dados'}
            </Button>

            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                O que está incluído na exportação?
              </h3>
              <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                <li>Informações pessoais (nome, CPF, e-mail, telefone)</li>
                <li>Todos os contratos associados ao seu CPF</li>
                <li>Endereços de instalação</li>
                <li>Coordenadas geográficas (se fornecidas)</li>
                <li>Especificações de projetos</li>
                <li>Informações financeiras</li>
                <li>Registros de auditoria de assinaturas</li>
              </ul>
            </div>

            <div className="pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Formato do Arquivo
              </h3>
              <p className="text-sm text-gray-700">
                Os dados serão exportados em formato JSON, que pode ser aberto em qualquer
                editor de texto ou importado em outros sistemas.
              </p>
            </div>

            <div className="pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Dúvidas sobre Privacidade?
              </h3>
              <p className="text-sm text-gray-700">
                Consulte nossa{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">
                  Política de Privacidade
                </a>{' '}
                para mais informações sobre como tratamos seus dados pessoais.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
