
import { ServiceItem } from './types';

export const INITIAL_SERVICES: ServiceItem[] = [
  { id: '1', description: 'Consultoria para dimensionamento e investimento em projetos de Energia Solar Fotovoltaica', is_included: true },
  { id: '2', description: 'Prestação de serviços de Engenharia e Projetos junto a Concessionária', is_included: true },
  { id: '3', description: 'Contratação da mão de obra especializada para execução do projeto', is_included: true },
  { id: '4', description: 'Contratação dos Equipamentos junto aos Fabricantes ou Distribuidores', is_included: true },
  { id: '5', description: 'Administração das questões burocráticas junto a Concessionária', is_included: true },
  { id: '6', description: 'Configuração dos equipamentos', is_included: true }
];

export const PAYMENT_OPTIONS = [
  { label: 'PIX', value: 'pix' },
  { label: 'Dinheiro', value: 'cash' },
  { label: 'Cartão de Crédito', value: 'credit_card' },
  { label: 'Financiamento', value: 'financing' }
];

export const ISOTEC_INFO = {
  name: 'ISOTEC',
  cnpj: '54.740.319/0001-82',
  address: 'Rua Doutor José Alfredo Guimarães, Nº 15, São Luís, Jequié/BA',
  cep: '45.203-330',
  admin: 'Icaro Lopes Lourenço'
};
