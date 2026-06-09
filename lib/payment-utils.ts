export interface PayFastConfig {
  merchantId: string;
  merchantKey: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  amount: number;
  itemName: string;
  itemDescription: string;
  customStr1?: string;
  customStr2?: string;
  customStr3?: string;
  emailConfirmation?: boolean;
  confirmationAddress?: string;
}

export const PAYFAST_URLS = {
  sandboxUrl: 'https://sandbox.payfast.co.za/eng/process',
  productionUrl: 'https://www.payfast.co.za/eng/process',
  notifyUrl: '/api/payfast/notify',
};

export const PAYFAST_TEST_CREDENTIALS = {
  merchantId: '10023443',
  merchantKey: 'e7p6jesdyy1tg',
};

export function getPayFastUrl(liveMode: boolean = false): string {
  return liveMode ? PAYFAST_URLS.productionUrl : PAYFAST_URLS.sandboxUrl;
}

export async function generatePayFastSignature(
  params: Record<string, string>,
  passphrase?: string
): Promise<string> {
  const crypto = require('crypto');
  const sortedKeys = Object.keys(params).sort();
  let queryString = sortedKeys
    .filter((key) => params[key] !== '' && params[key] !== undefined)
    .map((key) => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');
  if (passphrase) {
    queryString += `&passphrase=${encodeURIComponent(passphrase)}`;
  }
  return crypto.createHash('md5').update(queryString).digest('hex');
}

export function validatePayFastConfig(config: Partial<PayFastConfig>): string[] {
  const errors: string[] = [];
  if (!config.merchantId) errors.push('Merchant ID is required');
  if (!config.merchantKey) errors.push('Merchant Key is required');
  if (!config.amount || config.amount <= 0) errors.push('Valid amount is required');
  if (!config.itemName) errors.push('Item name is required');
  return errors;
}
