/**
 * PDF Document Component for Contract Generation
 * 
 * This component uses @react-pdf/renderer to generate professional PDF contracts
 * with company branding, contractor information, project specifications, and
 * equipment/services tables.
 * 
 * Requirements: 8.1, 8.2, 3A.5
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font
} from '@react-pdf/renderer';

// Note: Images removed due to file size constraints
// TODO: Implement image loading from public folder or external URL

// Register fonts for better typography
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
      fontWeight: 300
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
      fontWeight: 400
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf',
      fontWeight: 500
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
      fontWeight: 700
    }
  ]
});

// Define styles for the PDF document
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
    lineHeight: 1.5,
    backgroundColor: '#ffffff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottom: '2 solid #1e3a8a'
  },
  logo: {
    width: 120,
    height: 40,
    objectFit: 'contain'
  },
  companyInfo: {
    textAlign: 'right',
    fontSize: 8,
    color: '#475569'
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1e3a8a',
    marginBottom: 20,
    textAlign: 'center'
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#1e3a8a',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: '1 solid #cbd5e1'
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8
  },
  label: {
    width: '40%',
    fontWeight: 500,
    color: '#475569'
  },
  value: {
    width: '60%',
    color: '#1e293b'
  },
  table: {
    marginTop: 10,
    marginBottom: 10
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a',
    padding: 8,
    color: '#ffffff',
    fontWeight: 700
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e2e8f0',
    padding: 8
  },
  tableCell: {
    flex: 1,
    fontSize: 9
  },
  tableCellName: {
    flex: 3,
    fontSize: 9
  },
  tableCellQuantity: {
    flex: 1,
    fontSize: 9,
    textAlign: 'center'
  },
  tableCellUnit: {
    flex: 1,
    fontSize: 9,
    textAlign: 'center'
  },
  tableCellDescription: {
    flex: 3,
    fontSize: 9
  },
  tableCellStatus: {
    flex: 1,
    fontSize: 9,
    textAlign: 'center'
  },
  checkmark: {
    color: '#16a34a',
    fontWeight: 700
  },
  xmark: {
    color: '#dc2626',
    fontWeight: 700
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTop: '1 solid #cbd5e1'
  },
  mascot: {
    width: 60,
    height: 60,
    objectFit: 'contain'
  },
  footerText: {
    fontSize: 8,
    color: '#64748b',
    textAlign: 'center',
    flex: 1
  },
  pageNumber: {
    fontSize: 8,
    color: '#64748b'
  }
});

// Contract data interface
interface ContractData {
  // Contractor Information
  contractorName: string;
  contractorCPF: string;
  contractorEmail?: string;
  contractorPhone?: string;

  // Installation Address
  addressCEP: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement?: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;

  // Geographic Location (optional)
  locationLatitude?: number;
  locationLongitude?: number;

  // Project Specifications
  projectKWp: number;
  installationDate?: Date;

  // Equipment Items
  items: Array<{
    itemName: string;
    quantity: number;
    unit: string;
  }>;

  // Services
  services: Array<{
    description: string;
    included: boolean;
  }>;

  // Financial Information
  contractValue: number;
  paymentMethod: 'pix' | 'cash' | 'credit';

  // Metadata
  createdAt: Date;

  // Signature Information (optional - only present for signed contracts)
  signatureData?: {
    contractHash: string;
    signedAt: Date;
    signatureMethod: 'govbr' | 'email';
    signerIdentifier?: string;
  };
}

// Format currency to BRL
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Format date to Brazilian format
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

// Format CPF
const formatCPF = (cpf: string): string => {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

// Format CEP
const formatCEP = (cep: string): string => {
  return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
};

// Format coordinates
const formatCoordinates = (lat: number, lng: number): string => {
  return `${lat.toFixed(6)}°, ${lng.toFixed(6)}°`;
};

// Payment method labels
const paymentMethodLabels: Record<string, string> = {
  pix: 'PIX',
  cash: 'Dinheiro',
  credit: 'Cartão de Crédito'
};

/**
 * Contractor Information Section
 */
const ContractorSection: React.FC<{ data: ContractData }> = ({ data }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Dados do Contratante</Text>
    <View style={styles.row}>
      <Text style={styles.label}>Nome:</Text>
      <Text style={styles.value}>{data.contractorName}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>CPF:</Text>
      <Text style={styles.value}>{formatCPF(data.contractorCPF)}</Text>
    </View>
    {data.contractorEmail && (
      <View style={styles.row}>
        <Text style={styles.label}>E-mail:</Text>
        <Text style={styles.value}>{data.contractorEmail}</Text>
      </View>
    )}
    {data.contractorPhone && (
      <View style={styles.row}>
        <Text style={styles.label}>Telefone:</Text>
        <Text style={styles.value}>{data.contractorPhone}</Text>
      </View>
    )}
  </View>
);

/**
 * Installation Address Section
 */
const AddressSection: React.FC<{ data: ContractData }> = ({ data }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Endereço da Instalação</Text>
    <View style={styles.row}>
      <Text style={styles.label}>Logradouro:</Text>
      <Text style={styles.value}>
        {data.addressStreet}, {data.addressNumber}
        {data.addressComplement && ` - ${data.addressComplement}`}
      </Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Bairro:</Text>
      <Text style={styles.value}>{data.addressNeighborhood}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Cidade/UF:</Text>
      <Text style={styles.value}>
        {data.addressCity} - {data.addressState}
      </Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>CEP:</Text>
      <Text style={styles.value}>{formatCEP(data.addressCEP)}</Text>
    </View>
    {data.locationLatitude && data.locationLongitude && (
      <View style={styles.row}>
        <Text style={styles.label}>Coordenadas:</Text>
        <Text style={styles.value}>
          {formatCoordinates(data.locationLatitude, data.locationLongitude)}
        </Text>
      </View>
    )}
  </View>
);

/**
 * Project Specifications Section
 */
const ProjectSection: React.FC<{ data: ContractData }> = ({ data }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Especificações do Projeto</Text>
    <View style={styles.row}>
      <Text style={styles.label}>Potência (kWp):</Text>
      <Text style={styles.value}>{data.projectKWp.toFixed(2)} kWp</Text>
    </View>
    {data.installationDate && (
      <View style={styles.row}>
        <Text style={styles.label}>Data de Instalação:</Text>
        <Text style={styles.value}>{formatDate(data.installationDate)}</Text>
      </View>
    )}
    <View style={styles.row}>
      <Text style={styles.label}>Valor do Contrato:</Text>
      <Text style={styles.value}>{formatCurrency(data.contractValue)}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Forma de Pagamento:</Text>
      <Text style={styles.value}>{paymentMethodLabels[data.paymentMethod]}</Text>
    </View>
  </View>
);

/**
 * Equipment Table Section
 * Displays dynamic list of equipment items with name, quantity, and unit
 * Handles multi-page wrapping automatically
 * Requirements: 8.3, 8.5
 */
const EquipmentTable: React.FC<{ data: ContractData }> = ({ data }) => (
  <View style={styles.section} wrap={false}>
    <Text style={styles.sectionTitle}>Equipamentos</Text>
    {data.items.length > 0 ? (
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.tableCellName}>Equipamento</Text>
          <Text style={styles.tableCellQuantity}>Quantidade</Text>
          <Text style={styles.tableCellUnit}>Unidade</Text>
        </View>
        
        {/* Table Rows */}
        {data.items.map((item, index) => (
          <View key={index} style={styles.tableRow} wrap={false}>
            <Text style={styles.tableCellName}>{item.itemName}</Text>
            <Text style={styles.tableCellQuantity}>{item.quantity}</Text>
            <Text style={styles.tableCellUnit}>{item.unit}</Text>
          </View>
        ))}
      </View>
    ) : (
      <Text style={styles.value}>Nenhum equipamento especificado</Text>
    )}
  </View>
);

/**
 * Services Table Section
 * Displays dynamic list of services with description and included status
 * Handles multi-page wrapping automatically
 * Requirements: 8.3, 8.5
 */
const ServicesTable: React.FC<{ data: ContractData }> = ({ data }) => (
  <View style={styles.section} wrap={false}>
    <Text style={styles.sectionTitle}>Serviços Inclusos</Text>
    {data.services.length > 0 ? (
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.tableCellDescription}>Descrição do Serviço</Text>
          <Text style={styles.tableCellStatus}>Incluído</Text>
        </View>
        
        {/* Table Rows */}
        {data.services.map((service, index) => (
          <View key={index} style={styles.tableRow} wrap={false}>
            <Text style={styles.tableCellDescription}>{service.description}</Text>
            <Text style={[styles.tableCellStatus, service.included ? styles.checkmark : styles.xmark]}>
              {service.included ? '✓' : '✗'}
            </Text>
          </View>
        ))}
      </View>
    ) : (
      <Text style={styles.value}>Nenhum serviço especificado</Text>
    )}
  </View>
);

/**
 * Signature Verification Section
 * Displays signature verification information for signed contracts
 * Shows contract hash, timestamp, signature method, and signer identifier
 * Requirements: 8.4
 */
const SignatureVerificationSection: React.FC<{ data: ContractData }> = ({ data }) => {
  if (!data.signatureData) {
    return null;
  }

  const signatureMethodLabels: Record<string, string> = {
    govbr: 'GOV.BR (Assinatura Avançada)',
    email: 'E-mail (Assinatura Admitida)'
  };

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>Verificação de Assinatura Digital</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Hash do Contrato:</Text>
        <Text style={[styles.value, { fontSize: 8, fontFamily: 'Courier' }]}>
          {data.signatureData.contractHash}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Data/Hora da Assinatura:</Text>
        <Text style={styles.value}>
          {new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'medium'
          }).format(data.signatureData.signedAt)}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Método de Assinatura:</Text>
        <Text style={styles.value}>
          {signatureMethodLabels[data.signatureData.signatureMethod]}
        </Text>
      </View>
      {data.signatureData.signerIdentifier && (
        <View style={styles.row}>
          <Text style={styles.label}>Identificador do Signatário:</Text>
          <Text style={styles.value}>{data.signatureData.signerIdentifier}</Text>
        </View>
      )}
    </View>
  );
};

/**
 * Main PDF Document Component
 */
export const ContractPDF: React.FC<{ data: ContractData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        {/* <Image src={LOGO_BASE64} style={styles.logo} /> */}
        <View style={styles.companyInfo}>
          <Text>ISOTEC Energia Solar</Text>
          <Text>Contrato de Prestação de Serviços</Text>
          <Text>Data: {formatDate(data.createdAt)}</Text>
        </View>
      </View>

      {/* Document Title */}
      <Text style={styles.title}>CONTRATO DE INSTALAÇÃO DE SISTEMA FOTOVOLTAICO</Text>

      {/* Contractor Information */}
      <ContractorSection data={data} />

      {/* Installation Address */}
      <AddressSection data={data} />

      {/* Project Specifications */}
      <ProjectSection data={data} />

      {/* Equipment Table */}
      <EquipmentTable data={data} />

      {/* Services Table */}
      <ServicesTable data={data} />

      {/* Signature Verification Section (only for signed contracts) */}
      <SignatureVerificationSection data={data} />

      {/* Footer */}
      <View style={styles.footer}>
        {/* <Image src={MASCOT_BASE64} style={styles.mascot} /> */}
        <Text style={styles.footerText}>
          ISOTEC Energia Solar - Soluções em Energia Fotovoltaica
        </Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </View>
    </Page>
  </Document>
);

export default ContractPDF;
