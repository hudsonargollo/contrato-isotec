/**
 * Email Service using SMTP (Turbocloud/Nodemailer)
 * 
 * Provides email sending functionality for:
 * - Verification codes for contract signatures
 * - Contract notifications
 * - Admin notifications
 * 
 * Uses Nodemailer with SMTP (Turbocloud or any SMTP provider)
 * 
 * Requirements: 5.1
 */

import nodemailer from 'nodemailer';

/**
 * Create SMTP transporter
 */
function createTransporter() {
  // Check if SMTP is configured
  if (!process.env.SMTP_HOST) {
    console.warn('SMTP not configured - emails will be logged to console');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE !== 'false', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      // Remove quotes if present (for passwords with special chars like #)
      pass: process.env.SMTP_PASS?.replace(/^["']|["']$/g, ''),
    },
  });
}

/**
 * Email template for verification code
 */
function getVerificationEmailTemplate(code: string, contractorName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Verificação - ISOTEC</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 3px solid #f59e0b;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #f59e0b;
    }
    .content {
      padding: 30px 0;
    }
    .code-box {
      background: #f3f4f6;
      border: 2px solid #f59e0b;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
    }
    .code {
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 8px;
      color: #1f2937;
      font-family: 'Courier New', monospace;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px 0;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">⚡ ISOTEC</div>
    <p>Soluções em Energia Solar</p>
  </div>
  
  <div class="content">
    <h2>Código de Verificação</h2>
    <p>Olá${contractorName ? `, ${contractorName}` : ''}!</p>
    <p>Use o código abaixo para assinar digitalmente seu contrato de instalação fotovoltaica:</p>
    
    <div class="code-box">
      <div class="code">${code}</div>
    </div>
    
    <div class="warning">
      <strong>⚠️ Importante:</strong>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Este código expira em <strong>15 minutos</strong></li>
        <li>Não compartilhe este código com ninguém</li>
        <li>Se você não solicitou este código, ignore este email</li>
      </ul>
    </div>
    
    <p>Ao assinar o contrato, você concorda com os termos e condições especificados no documento.</p>
    
    <p style="margin-top: 30px;">
      <strong>Dúvidas?</strong><br>
      Entre em contato conosco através do nosso site ou telefone.
    </p>
  </div>
  
  <div class="footer">
    <p>ISOTEC - Soluções em Energia Solar Fotovoltaica</p>
    <p>Este é um email automático, por favor não responda.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send verification code email
 * 
 * @param to Recipient email address
 * @param code 6-digit verification code
 * @param contractorName Contractor's name (optional)
 * @returns Success status
 */
export async function sendVerificationEmail(
  to: string,
  code: string,
  contractorName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter();
    
    // Development mode or SMTP not configured - log to console
    if (!transporter || process.env.NODE_ENV === 'development') {
      console.log('\n=== EMAIL SENT ===');
      console.log('To:', to);
      console.log('Subject: Código de Verificação - ISOTEC');
      console.log('Code:', code);
      if (contractorName) {
        console.log('Contractor:', contractorName);
      }
      console.log('Template: HTML email with ISOTEC branding');
      console.log('==================\n');
      
      return { success: true };
    }

    // Production mode - send actual email via SMTP
    const mailOptions = {
      from: {
        name: process.env.SMTP_FROM_NAME || 'ISOTEC',
        address: process.env.SMTP_FROM || 'noreply@isotec.com.br',
      },
      to,
      subject: 'Código de Verificação - ISOTEC',
      html: getVerificationEmailTemplate(code, contractorName || ''),
      text: `Seu código de verificação é: ${code}\n\nEste código expira em 15 minutos.`,
    };

    await transporter.sendMail(mailOptions);
    
    console.log(`Verification email sent to ${to}`);
    return { success: true };
    
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send contract signed notification
 * 
 * @param to Recipient email address
 * @param contractUuid Contract UUID for viewing
 * @param contractorName Contractor's name
 * @returns Success status
 */
/**
 * Send contract signed notification with PDF attachment
 * 
 * @param to Recipient email address
 * @param contractUuid Contract UUID for viewing
 * @param contractorName Contractor's name
 * @returns Success status
 */
export async function sendContractSignedNotification(
  to: string,
  contractUuid: string,
  contractorName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter();
    const contractUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/contracts/${contractUuid}`;
    const pdfUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/contracts/${contractUuid}/pdf`;
    
    // Development mode or SMTP not configured - log to console
    if (!transporter || process.env.NODE_ENV === 'development') {
      console.log('\n=== CONTRACT SIGNED EMAIL ===');
      console.log('To:', to);
      console.log('Contractor:', contractorName);
      console.log('Contract URL:', contractUrl);
      console.log('PDF URL:', pdfUrl);
      console.log('Template: HTML confirmation email with PDF attachment');
      console.log('=============================\n');
      
      return { success: true };
    }

    // Fetch PDF content for attachment
    let pdfAttachment = null;
    try {
      const pdfResponse = await fetch(pdfUrl);
      if (pdfResponse.ok) {
        const pdfBuffer = await pdfResponse.arrayBuffer();
        pdfAttachment = {
          filename: `contrato-${contractUuid}.pdf`,
          content: Buffer.from(pdfBuffer),
          contentType: 'application/pdf'
        };
      }
    } catch (pdfError) {
      console.error('Error fetching PDF for email attachment:', pdfError);
      // Continue without PDF attachment
    }

    // Production mode - send actual email via SMTP
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Contrato Assinado - ISOTEC</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; padding: 20px 0; border-bottom: 3px solid #10b981;">
    <h1 style="color: #10b981; margin: 0;">✓ Contrato Assinado</h1>
  </div>
  
  <div style="padding: 30px 0;">
    <p>Olá, ${contractorName}!</p>
    <p>Seu contrato de instalação fotovoltaica foi assinado com sucesso!</p>
    
    <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 15px 0;">Você pode visualizar seu contrato a qualquer momento:</p>
      <a href="${contractUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Ver Contrato Online
      </a>
    </div>
    
    ${pdfAttachment ? `
    <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>📎 Anexo:</strong> O contrato completo em PDF está anexado a este email para sua conveniência.</p>
    </div>
    ` : ''}
    
    <p><strong>Próximos passos:</strong></p>
    <ol>
      <li>Nossa equipe entrará em contato para agendar a instalação</li>
      <li>Você receberá atualizações sobre o progresso do projeto</li>
      <li>Mantenha este email e o PDF anexo para referência futura</li>
    </ol>
    
    <p style="margin-top: 30px;">Obrigado por escolher a ISOTEC!</p>
  </div>
  
  <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
    <p>ISOTEC - Soluções em Energia Solar Fotovoltaica</p>
  </div>
</body>
</html>
    `.trim();

    const mailOptions: any = {
      from: {
        name: process.env.SMTP_FROM_NAME || 'ISOTEC',
        address: process.env.SMTP_FROM || 'noreply@isotec.com.br',
      },
      to,
      subject: 'Contrato Assinado - ISOTEC (PDF Anexo)',
      html,
      text: `Olá, ${contractorName}!\n\nSeu contrato foi assinado com sucesso!\n\nVisualize em: ${contractUrl}\n\n${pdfAttachment ? 'O contrato em PDF está anexado a este email.' : ''}`,
    };

    // Add PDF attachment if available
    if (pdfAttachment) {
      mailOptions.attachments = [pdfAttachment];
    }

    await transporter.sendMail(mailOptions);
    
    console.log(`Contract signed notification sent to ${to}${pdfAttachment ? ' with PDF attachment' : ''}`);
    return { success: true };
    
  } catch (error) {
    console.error('Error sending notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send notification',
    };
  }
}

/**
 * Configuration for email service
 * 
 * To use a third-party service, add these environment variables:
 * - EMAIL_SERVICE_PROVIDER: 'sendgrid' | 'ses' | 'resend' | 'smtp'
 * - EMAIL_API_KEY: API key for the service
 * - EMAIL_FROM: Sender email address
 * - EMAIL_FROM_NAME: Sender name
 */
export const emailConfig = {
  provider: process.env.EMAIL_SERVICE_PROVIDER || 'console',
  apiKey: process.env.EMAIL_API_KEY,
  from: process.env.EMAIL_FROM || 'noreply@isotec.com.br',
  fromName: process.env.EMAIL_FROM_NAME || 'ISOTEC',
};
