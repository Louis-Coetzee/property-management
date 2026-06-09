export interface PaygateConfig {
  payGateId: string;
  encryptionKey: string;
  returnUrl: string;
  notifyUrl: string;
  amount: number;
  currency?: string;
  orderNumber: string;
  transactionReference: string;
  description: string;
  optional1?: string;
  optional2?: string;
  optional3?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  countryCode?: string;
}

export interface PaygateResponse {
  payRequestId: string;
  checksum: string;
  processUrl: string;
  redirectUrl: string;
}

export const PAYGATE_URLS = {
  test: {
    initiateUrl: 'https://secure.paygate.co.za/payweb3/initiate.trans',
    processUrl: 'https://secure.paygate.co.za/payweb3/process.trans',
    queryUrl: 'https://secure.paygate.co.za/payweb3/query.trans',
  },
  production: {
    initiateUrl: 'https://secure.paygate.co.za/payweb3/initiate.trans',
    processUrl: 'https://secure.paygate.co.za/payweb3/process.trans',
    queryUrl: 'https://secure.paygate.co.za/payweb3/query.trans',
  },
};

export const PAYGATE_TEST_CREDENTIALS = {
  payGateId: '10011072130',
  encryptionKey: 'secret',
};

export function generatePaygateChecksum(data: string, encryptionKey: string): string {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(data + encryptionKey).digest('hex');
}

export function getPaygateUrls(liveMode: boolean = false): typeof PAYGATE_URLS.test {
  return liveMode ? PAYGATE_URLS.production : PAYGATE_URLS.test;
}

export function parsePaygateResponse(responseText: string): Record<string, string> {
  const params = new URLSearchParams(responseText);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export function isTransactionSuccessful(statusCode: string, resultCode: string): boolean {
  return statusCode === '1' && resultCode === '990017';
}

export function getTransactionStatusDescription(statusCode: string): string {
  const statuses: Record<string, string> = {
    '0': 'Transaction cancelled',
    '1': 'Transaction approved',
    '2': 'Transaction declined',
    '3': 'Transaction error',
    '4': 'Transaction expired',
  };
  return statuses[statusCode] || 'Unknown status';
}
