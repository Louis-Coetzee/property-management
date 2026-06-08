'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import React from 'react';

export type Currency =
  | 'ZAR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD' | 'JPY' | 'CHF' | 'SGD'
  | 'HKD' | 'NZD' | 'SEK' | 'NOK' | 'DKK' | 'PLN';

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  rate: number;
  flag: string;
}

const currencies: Record<Currency, CurrencyInfo> = {
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', rate: 1, flag: '🇿🇦' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.055, flag: '🇺🇸' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.051, flag: '🇪🇺' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.044, flag: '🇬🇧' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 0.085, flag: '🇦🇺' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 0.075, flag: '🇨🇦' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 0.0084, flag: '🇯🇵' },
  CHF: { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', rate: 0.053, flag: '🇨🇭' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 0.058, flag: '🇸🇬' },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', rate: 0.0071, flag: '🇭🇰' },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', rate: 0.094, flag: '🇳🇿' },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', rate: 0.0051, flag: '🇸🇪' },
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', rate: 0.0051, flag: '🇳🇴' },
  DKK: { code: 'DKK', symbol: 'kr.', name: 'Danish Krone', rate: 0.0083, flag: '🇩🇰' },
  PLN: { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', rate: 0.014, flag: '🇵🇱' },
};

interface CurrencyContextType {
  currency: Currency;
  currencyInfo: CurrencyInfo;
  setCurrency: (currency: Currency) => void;
  convertPrice: (priceInZAR: number) => string;
  formatPrice: (priceInZAR: number, showSymbol?: boolean) => string;
  getAllCurrencies: () => CurrencyInfo[];
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('ZAR');

  useEffect(() => {
    const detectCurrency = async () => {
      const savedCurrency = localStorage.getItem('selectedCurrency') as Currency;
      if (savedCurrency && currencies[savedCurrency]) {
        setCurrencyState(savedCurrency);
        return;
      }

      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        const countryToCurrency: Record<string, Currency> = {
          'US': 'USD', 'GB': 'GBP', 'AU': 'AUD', 'CA': 'CAD', 'ZA': 'ZAR',
          'JP': 'JPY', 'CH': 'CHF', 'SG': 'SGD', 'HK': 'HKD', 'NZ': 'NZD',
          'SE': 'SEK', 'NO': 'NOK', 'DK': 'DKK', 'PL': 'PLN',
          'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR',
          'BE': 'EUR', 'AT': 'EUR', 'IE': 'EUR', 'PT': 'EUR', 'GR': 'EUR',
          'NA': 'ZAR', 'ZW': 'USD',
        };

        const detectedCurrency = countryToCurrency[data.country_code] || 'ZAR';
        setCurrencyState(detectedCurrency);
        localStorage.setItem('selectedCurrency', detectedCurrency);
      } catch (error) {
        console.error('Failed to detect currency:', error);
        setCurrencyState('ZAR');
      }
    };

    detectCurrency();
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('selectedCurrency', newCurrency);
  };

  const currencyInfo = currencies[currency];

  const convertPrice = (priceInZAR: number): string => {
    const convertedPrice = priceInZAR * currencyInfo.rate;
    return `${currencyInfo.symbol}${convertedPrice.toFixed(2)}`;
  };

  const formatPrice = (priceInZAR: number, showSymbol: boolean = true): string => {
    const convertedPrice = priceInZAR * currencyInfo.rate;
    return showSymbol
      ? `${currencyInfo.symbol}${convertedPrice.toFixed(2)}`
      : `${convertedPrice.toFixed(2)}`;
  };

  const getAllCurrencies = (): CurrencyInfo[] => {
    return Object.values(currencies).sort((a, b) => a.name.localeCompare(b.name));
  };

  return (
    <CurrencyContext.Provider
      value={{ currency, currencyInfo, setCurrency, convertPrice, formatPrice, getAllCurrencies }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
