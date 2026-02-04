
export interface Address {
  zip_code: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface Equipment {
  id: string;
  quantity: number;
  name: string;
  manufacturer: string;
}

export interface ServiceItem {
  id: string;
  description: string;
  is_included: boolean;
}

export interface Contract {
  id: string;
  customer_name: string;
  customer_cpf: string;
  capacity_kwp: number;
  total_value: number;
  status: 'draft' | 'pending' | 'signed';
  address: Address;
  equipment: Equipment[];
  services: ServiceItem[];
  payment_methods: string[];
}

export enum WizardStep {
  CUSTOMER_BASIC,
  CUSTOMER_ADDRESS,
  TECHNICAL_SPECS,
  SERVICES,
  FINANCIALS,
  PREVIEW
}
