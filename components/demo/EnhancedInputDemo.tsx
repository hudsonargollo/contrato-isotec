/**
 * Enhanced Input Component Demo
 * Showcases all features of the enhanced Input component including:
 * - Focus states with border and ring effects
 * - Error and success states
 * - Floating label support
 * - Disabled state styling
 * - Different sizes and variants
 * - Icon support
 */

'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Search, 
  Eye, 
  EyeOff,
  MapPin,
  Calendar
} from 'lucide-react';

export function EnhancedInputDemo() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    search: '',
    address: '',
    date: '',
    cardNumber: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Simple validation examples
    if (field === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(value)) {
        setSuccess(prev => ({ ...prev, email: 'Valid email format' }));
        setErrors(prev => ({ ...prev, email: '' }));
      } else {
        setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
        setSuccess(prev => ({ ...prev, email: '' }));
      }
    }
    
    if (field === 'confirmPassword' && value) {
      if (value === formData.password) {
        setSuccess(prev => ({ ...prev, confirmPassword: 'Passwords match' }));
        setErrors(prev => ({ ...prev, confirmPassword: '' }));
      } else {
        setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
        setSuccess(prev => ({ ...prev, confirmPassword: '' }));
      }
    }
    
    if (field === 'phone' && value) {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      if (phoneRegex.test(value)) {
        setSuccess(prev => ({ ...prev, phone: 'Valid phone number' }));
        setErrors(prev => ({ ...prev, phone: '' }));
      } else {
        setErrors(prev => ({ ...prev, phone: 'Please enter a valid phone number' }));
        setSuccess(prev => ({ ...prev, phone: '' }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      alert('Form submitted successfully!');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-neutral-900">Enhanced Input Component Demo</h1>
        <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
          Showcasing all features of the enhanced Input component including focus states, 
          validation feedback, floating labels, disabled states, and icon support.
        </p>
      </div>

      {/* Basic Input Variants */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6 text-neutral-900">Basic Input Variants</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-neutral-700 mb-3">Default</h3>
            <Input
              placeholder="Enter your text..."
              value={formData.search}
              onChange={(e) => handleInputChange('search', e.target.value)}
            />
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-neutral-700 mb-3">With Label</h3>
            <Input
              label="Search"
              placeholder="Search for something..."
              value={formData.search}
              onChange={(e) => handleInputChange('search', e.target.value)}
            />
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-neutral-700 mb-3">Disabled</h3>
            <Input
              label="Disabled Input"
              placeholder="This is disabled"
              disabled
              value="Cannot edit this"
            />
          </div>
        </div>
      </Card>

      {/* Size Variants */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6 text-neutral-900">Size Variants</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Small</h3>
            <Input
              size="sm"
              placeholder="Small input"
              className="max-w-xs"
            />
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Default</h3>
            <Input
              placeholder="Default size input"
              className="max-w-sm"
            />
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Large</h3>
            <Input
              size="lg"
              placeholder="Large input"
              className="max-w-md"
            />
          </div>
        </div>
      </Card>

      {/* Floating Labels */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6 text-neutral-900">Floating Labels</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            floatingLabel
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={errors.email}
            success={success.email}
          />
          
          <Input
            floatingLabel
            label="Full Name"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            error={errors.firstName}
          />
          
          <Input
            floatingLabel
            label="Phone Number"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            error={errors.phone}
            success={success.phone}
          />
          
          <Input
            floatingLabel
            label="Address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            helperText="Enter your full address"
          />
        </div>
      </Card>

      {/* Icons and Advanced Features */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6 text-neutral-900">Icons and Advanced Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Email"
            type="email"
            icon={<Mail className="h-5 w-5" />}
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={errors.email}
            success={success.email}
          />
          
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              icon={<Lock className="h-5 w-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-neutral-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              }
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              error={errors.password}
            />
          </div>
          
          <Input
            label="Search Location"
            icon={<MapPin className="h-5 w-5" />}
            rightIcon={<Search className="h-4 w-4" />}
            placeholder="Search for a location"
          />
          
          <Input
            label="Date"
            type="date"
            icon={<Calendar className="h-5 w-5" />}
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
          />
        </div>
      </Card>

      {/* Validation States */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6 text-neutral-900">Validation States</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Input
            label="Error State"
            placeholder="This has an error"
            error="This field is required"
            value=""
          />
          
          <Input
            label="Success State"
            placeholder="This is valid"
            success="Looks good!"
            value="Valid input"
          />
          
          <Input
            label="With Helper Text"
            placeholder="Enter some text"
            helperText="This is some helpful information"
          />
        </div>
      </Card>

      {/* Interactive Form Example */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6 text-neutral-900">Interactive Form Example</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              floatingLabel
              label="First Name"
              icon={<User className="h-5 w-5" />}
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              error={errors.firstName}
              required
            />
            
            <Input
              floatingLabel
              label="Last Name"
              icon={<User className="h-5 w-5" />}
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
            />
          </div>
          
          <Input
            floatingLabel
            label="Email Address"
            type="email"
            icon={<Mail className="h-5 w-5" />}
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={errors.email}
            success={success.email}
            required
          />
          
          <Input
            floatingLabel
            label="Password"
            type={showPassword ? 'text' : 'password'}
            icon={<Lock className="h-5 w-5" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:text-neutral-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            }
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            error={errors.password}
            helperText="Password must be at least 8 characters long"
            required
          />
          
          <Input
            floatingLabel
            label="Confirm Password"
            type="password"
            icon={<Lock className="h-5 w-5" />}
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            error={errors.confirmPassword}
            success={success.confirmPassword}
            required
          />
          
          <Input
            floatingLabel
            label="Phone Number"
            type="tel"
            icon={<Phone className="h-5 w-5" />}
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            error={errors.phone}
            success={success.phone}
            helperText="Include country code if international"
          />
          
          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1">
              Submit Form
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setFormData({
                  email: '',
                  password: '',
                  confirmPassword: '',
                  firstName: '',
                  lastName: '',
                  phone: '',
                  search: '',
                  address: '',
                  date: '',
                  cardNumber: '',
                });
                setErrors({});
                setSuccess({});
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </Card>

      {/* Accessibility Features */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6 text-neutral-900">Accessibility Features</h2>
        <div className="space-y-4">
          <p className="text-neutral-600">
            The enhanced Input component includes several accessibility features:
          </p>
          <ul className="list-disc list-inside space-y-2 text-neutral-600">
            <li>Proper ARIA labels and descriptions</li>
            <li>Keyboard navigation support</li>
            <li>Focus indicators with high contrast</li>
            <li>Screen reader compatible error messages</li>
            <li>Semantic HTML structure</li>
            <li>Color contrast compliance (WCAG 2.1 AA)</li>
          </ul>
          
          <div className="mt-6">
            <Input
              label="Accessible Input Example"
              placeholder="Try navigating with keyboard"
              helperText="Use Tab to navigate, Enter to submit"
              aria-describedby="accessible-help"
            />
            <p id="accessible-help" className="sr-only">
              This input demonstrates accessibility features including proper labeling and keyboard navigation.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}