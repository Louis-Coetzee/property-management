export interface PayFastSettings {
  enabled: boolean;
  liveMode: boolean;
  merchantId: string;
  merchantKey: string;
  passphrase?: string;
}

export interface PaymentGatewayConfig {
  payfast: PayFastSettings;
  paygate: {
    enabled: boolean;
    liveMode: boolean;
    payGateId: string;
    encryptionKey: string;
  };
  defaultGateway?: 'payfast' | 'paygate';
}

export function getPayFastConfig(settings: any): PayFastSettings {
  const payment = settings?.payment;
  return {
    enabled: payment?.payfast?.enabled ?? true,
    liveMode: payment?.payfast?.liveMode ?? false,
    merchantId: payment?.payfast?.merchantId || '10023443',
    merchantKey: payment?.payfast?.merchantKey || 'e7p6jesdyy1tg',
    passphrase: payment?.payfast?.passphrase,
  };
}

export function getPaygateConfig(settings: any) {
  const payment = settings?.payment;
  return {
    enabled: payment?.paygate?.enabled ?? false,
    liveMode: payment?.paygate?.liveMode ?? false,
    payGateId: payment?.paygate?.payGateId || '10011072130',
    encryptionKey: payment?.paygate?.encryptionKey || 'secret',
  };
}

export function getPaymentGatewayConfig(settings: any, gateway: 'payfast' | 'paygate') {
  return gateway === 'payfast' ? getPayFastConfig(settings) : getPaygateConfig(settings);
}

export function isGatewayEnabled(settings: any, gateway: 'payfast' | 'paygate'): boolean {
  const config = getPaymentGatewayConfig(settings, gateway);
  return config.enabled;
}

export function getEnabledGateways(settings: any): string[] {
  const gateways: string[] = [];
  if (isGatewayEnabled(settings, 'payfast')) gateways.push('payfast');
  if (isGatewayEnabled(settings, 'paygate')) gateways.push('paygate');
  return gateways;
}
