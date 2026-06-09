'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { CreditCard, CheckCircle2, Info } from 'lucide-react';

interface PaymentGateway {
  name: string;
  value: 'payfast' | 'paygate';
  description: string;
  features: string[];
  icon: React.ReactNode;
  enabled: boolean;
}

interface PaymentGatewaySelectorProps {
  selectedGateway: 'payfast' | 'paygate' | null;
  onGatewaySelect: (gateway: 'payfast' | 'paygate') => void;
  disabled?: boolean;
}

const DEFAULT_GATEWAYS: PaymentGateway[] = [
  {
    name: 'PayFast',
    value: 'payfast',
    description: 'South Africa\'s trusted online payment gateway',
    features: [
      'Instant EFT',
      'Credit & Debit Cards',
      'Masterpass',
      'Zapper',
      'Secure transactions',
    ],
    icon: <CreditCard className="h-6 w-6 text-green-600" />,
    enabled: true,
  },
  {
    name: 'Paygate',
    value: 'paygate',
    description: 'Secure payment processing by Nedbank',
    features: [
      'Credit & Debit Cards',
      '3D Secure',
      'EFT payments',
      'Recurring billing',
      'Fraud protection',
    ],
    icon: <CreditCard className="h-6 w-6 text-blue-600" />,
    enabled: true,
  },
];

export function PaymentGatewaySelector({
  selectedGateway,
  onGatewaySelect,
  disabled = false
}: PaymentGatewaySelectorProps) {
  const gateways = DEFAULT_GATEWAYS;

  if (gateways.length === 0) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <Info className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-orange-900 mb-2">
              Payment Gateways Not Configured
            </h3>
            <p className="text-orange-700 mb-4">
              No payment gateways are currently enabled. Please contact support to set up payment processing.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (gateways.length === 1) {
    // Only show single gateway
    const gateway = gateways[0];
    return (
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {gateway.icon}
            <span>Payment Method</span>
          </CardTitle>
          <CardDescription>
            You will be redirected to {gateway.name} to complete your payment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-medium">{gateway.name}</span>
            </div>
            <div className="pl-7 space-y-2">
              {gateway.features.map((feature, index) => (
                <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show multiple gateway selection
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-purple-600" />
          <span>Select Payment Gateway</span>
        </CardTitle>
        <CardDescription>
          Choose your preferred payment method for this transaction
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={selectedGateway || ''}
          onValueChange={(value: string) => onGatewaySelect(value as 'payfast' | 'paygate')}
          disabled={disabled}
        >
          {gateways.map((gateway) => (
            <div key={gateway.value} className="space-y-3">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value={gateway.value} id={gateway.value} />
                <Label htmlFor={gateway.value} className="flex items-center gap-3 cursor-pointer">
                  {gateway.icon}
                  <div>
                    <div className="font-medium">{gateway.name}</div>
                    <div className="text-sm text-gray-500">{gateway.description}</div>
                  </div>
                </Label>
              </div>

              {selectedGateway === gateway.value && (
                <div className="ml-8 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-medium text-gray-900 mb-2">Features:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {gateway.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </RadioGroup>

        {selectedGateway && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Info className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-blue-900">
                You will be redirected to {gateways.find(g => g.value === selectedGateway)?.name}
                to complete your payment securely.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}