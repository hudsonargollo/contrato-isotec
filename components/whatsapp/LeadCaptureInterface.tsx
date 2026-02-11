/**
 * Lead Capture Interface
 * Requirements: 5.5 - WhatsApp Business Integration with CRM
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  Phone, 
  Mail, 
  Building, 
  MessageCircle,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface LeadCaptureInterfaceProps {
  onCaptureSuccess?: () => void;
}

export function LeadCaptureInterface({ onCaptureSuccess }: LeadCaptureInterfaceProps) {
  const [formData, setFormData] = useState({
    phone_number: '',
    first_name: '',
    last_name: '',
    email: '',
    company: '',
    source_message: ''
  });
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    lead_id?: string;
    is_new_lead: boolean;
    error?: string;
  } | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone_number.trim()) {
      toast.error('Phone number is required');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/whatsapp/crm-integration/capture-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone_number: formData.phone_number,
          first_name: formData.first_name || undefined,
          last_name: formData.last_name || undefined,
          email: formData.email || undefined,
          company: formData.company || undefined,
          source_message: formData.source_message || undefined
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setLastResult({
          success: true,
          lead_id: result.data.lead_id,
          is_new_lead: result.data.is_new_lead
        });
        
        if (result.data.is_new_lead) {
          toast.success('New lead created and linked to WhatsApp conversation');
        } else {
          toast.success('Existing lead linked to WhatsApp conversation');
        }
        
        // Reset form
        setFormData({
          phone_number: '',
          first_name: '',
          last_name: '',
          email: '',
          company: '',
          source_message: ''
        });
        
        onCaptureSuccess?.();
      } else {
        setLastResult({
          success: false,
          is_new_lead: false,
          error: result.error || 'Failed to capture lead'
        });
        toast.error(result.error || 'Failed to capture lead');
      }
    } catch (error) {
      console.error('Failed to capture lead:', error);
      setLastResult({
        success: false,
        is_new_lead: false,
        error: 'Network error occurred'
      });
      toast.error('Failed to capture lead');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      phone_number: '',
      first_name: '',
      last_name: '',
      email: '',
      company: '',
      source_message: ''
    });
    setLastResult(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Capture Lead from WhatsApp
          </CardTitle>
          <CardDescription>
            Create new CRM leads from WhatsApp conversations or link existing leads by phone number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone Number - Required */}
            <div className="space-y-2">
              <Label htmlFor="phone_number" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number *
              </Label>
              <Input
                id="phone_number"
                type="tel"
                placeholder="+55 11 99999-9999"
                value={formData.phone_number}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                The phone number from the WhatsApp conversation
              </p>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  placeholder="John"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  placeholder="Doe"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="company" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Company
              </Label>
              <Input
                id="company"
                placeholder="Company Name"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
              />
            </div>

            {/* Source Message */}
            <div className="space-y-2">
              <Label htmlFor="source_message" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Initial Message
              </Label>
              <Textarea
                id="source_message"
                placeholder="The initial WhatsApp message that started the conversation..."
                value={formData.source_message}
                onChange={(e) => handleInputChange('source_message', e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Optional: The message that initiated the conversation
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Capture Lead
              </Button>
              <Button type="button" variant="outline" onClick={handleClear}>
                Clear Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Result Display */}
      {lastResult && (
        <Card className={lastResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {lastResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${lastResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {lastResult.success ? 'Success!' : 'Error'}
                  </span>
                  {lastResult.success && (
                    <Badge variant={lastResult.is_new_lead ? 'default' : 'secondary'}>
                      {lastResult.is_new_lead ? 'New Lead Created' : 'Existing Lead Linked'}
                    </Badge>
                  )}
                </div>
                <p className={`text-sm ${lastResult.success ? 'text-green-700' : 'text-red-700'}`}>
                  {lastResult.success ? (
                    lastResult.is_new_lead ? 
                      'A new lead has been created and linked to the WhatsApp conversation.' :
                      'The WhatsApp conversation has been linked to an existing lead.'
                  ) : (
                    lastResult.error || 'An error occurred while capturing the lead.'
                  )}
                </p>
                {lastResult.success && lastResult.lead_id && (
                  <p className="text-xs text-muted-foreground">
                    Lead ID: {lastResult.lead_id}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                1
              </div>
              <p>Enter the phone number from the WhatsApp conversation</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                2
              </div>
              <p>Fill in any additional information you have about the contact</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                3
              </div>
              <p>The system will either create a new lead or link to an existing one based on the phone number</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                4
              </div>
              <p>All future WhatsApp messages will be automatically tracked in the CRM</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}