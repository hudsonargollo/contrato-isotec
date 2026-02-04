/**
 * Data Export API Endpoint
 * 
 * Allows contractors to request export of their personal data
 * in compliance with LGPD Article 18.
 * 
 * Requirements: 11.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateDataExportJSON } from '@/lib/services/data-export';
import { validateCPF } from '@/lib/validation/cpf';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cpf } = body;

    // Validate CPF
    if (!cpf || !validateCPF(cpf)) {
      return NextResponse.json(
        { error: 'CPF inválido' },
        { status: 400 }
      );
    }

    // Generate export
    const exportData = await generateDataExportJSON(cpf);

    if (!exportData) {
      return NextResponse.json(
        { error: 'Nenhum dado encontrado para este CPF' },
        { status: 404 }
      );
    }

    // Return JSON data with appropriate headers
    return new NextResponse(exportData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="dados-pessoais-${cpf.replace(/\D/g, '')}.json"`,
      },
    });
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Erro ao exportar dados' },
      { status: 500 }
    );
  }
}
