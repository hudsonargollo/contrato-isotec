
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Zap, 
  Settings, 
  DollarSign, 
  FileText, 
  Plus, 
  Trash2, 
  Download, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Search,
  MapPin,
  PlusCircle
} from 'lucide-react';
import { Contract, WizardStep, ServiceItem } from './types';
import { INITIAL_SERVICES, PAYMENT_OPTIONS, ISOTEC_INFO } from './constants';
import { formatCurrency, formatCPF, formatCEP } from './utils/formatters';

const App: React.FC = () => {
  const [step, setStep] = useState<WizardStep>(WizardStep.CUSTOMER_BASIC);
  const [isSigned, setIsSigned] = useState(false);
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [contract, setContract] = useState<Contract>({
    id: Math.random().toString(36).substr(2, 9).toUpperCase(),
    customer_name: '',
    customer_cpf: '',
    capacity_kwp: 0,
    total_value: 0,
    status: 'draft',
