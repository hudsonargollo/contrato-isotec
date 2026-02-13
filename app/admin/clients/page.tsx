'use client';

/**
 * Admin Clients Page
 * 
 * Displays a list of all clients (contractors) from contracts
 * Provides search, filtering, and client management capabilities
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Phone, Mail, MapPin } from 'lucide-react';
import { formatCPF } from '@/lib/validation/cpf';

interface Client {
  id: string;
  name: string;
  cpf: string;
  email?: string;
  phone?: string;
  city: string;
  state: string;
  contractsCount: number;
  lastContractDate: string;
  totalValue: number;
}

function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    // Filter clients based on search query
    if (!searchQuery.trim()) {
      setFilteredClients(clients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(query) ||
        client.cpf.includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.city.toLowerCase().includes(query)
      );
      setFilteredClients(filtered);
    }
  }, [clients, searchQuery]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      } else {
        console.error('Failed to fetch clients');
        // For now, show sample data
        setClients([
          {
            id: '1',
            name: 'João Silva Santos',
            cpf: '123.456.789-09',
            email: 'joao@email.com',
            phone: '(11) 98765-4321',
            city: 'São Paulo',
            state: 'SP',
            contractsCount: 2,
            lastContractDate: '2024-02-10',
            totalValue: 45000
          },
          {
            id: '2',
            name: 'Maria Oliveira Costa',
            cpf: '987.654.321-00',
            email: 'maria@email.com',
            phone: '(21) 99876-5432',
            city: 'Rio de Janeiro',
            state: 'RJ',
            contractsCount: 1,
            lastContractDate: '2024-02-08',
            totalValue: 32000
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-neutral-400">Gerencie todos os clientes do sistema</p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-neutral-700 text-neutral-300">
            <Users className="w-4 h-4 mr-1" />
            {filteredClients.length} clientes
          </Badge>
        </div>
      </div>

      {/* Search */}
      <Card className="bg-neutral-800/50 border-neutral-700">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome, CPF, email ou cidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-neutral-700/50 border-neutral-600 text-white placeholder-neutral-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-neutral-400">Carregando clientes...</div>
        </div>
      ) : filteredClients.length === 0 ? (
        <Card className="bg-neutral-800/50 border-neutral-700">
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {searchQuery ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </h3>
            <p className="text-neutral-400">
              {searchQuery
                ? 'Tente ajustar os termos de busca'
                : 'Os clientes aparecerão aqui quando contratos forem criados'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="bg-neutral-800/50 border-neutral-700 hover:bg-neutral-800/70 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Client Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-white">{client.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {formatCPF(client.cpf)}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400">
                      {client.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          <span>{client.email}</span>
                        </div>
                      )}

                      {client.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          <span>{client.phone}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{client.city}, {client.state}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-col sm:flex-row gap-4 lg:gap-6">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-white">{client.contractsCount}</div>
                      <div className="text-xs text-neutral-400">Contratos</div>
                    </div>

                    <div className="text-center">
                      <div className="text-lg font-semibold text-solar-400">{formatCurrency(client.totalValue)}</div>
                      <div className="text-xs text-neutral-400">Total</div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm font-medium text-white">{formatDate(client.lastContractDate)}</div>
                      <div className="text-xs text-neutral-400">Último contrato</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                    >
                      Ver Contratos
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
