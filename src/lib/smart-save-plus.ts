import type { CurrencyCode, SmartSavePlusState, ProtectedCurrencyHolding, CurrencyTransaction, Bank } from "../types";
import { convertCurrency } from "./finance";
import type { ExchangeRateSnapshot } from "../types";

export function calculateTotalProtectedValue(
  holdings: ProtectedCurrencyHolding[],
  localCurrency: CurrencyCode,
  exchangeRates: ExchangeRateSnapshot | null
): number {
  return holdings.reduce((total, holding) => {
    const currentValue = convertCurrency(holding.amount, localCurrency, holding.currency, exchangeRates);
    return total + currentValue;
  }, 0);
}

export function buyCurrency(
  amount: number,
  currency: CurrencyCode,
  bankId: string,
  localCurrency: CurrencyCode,
  exchangeRates: ExchangeRateSnapshot | null,
  state: SmartSavePlusState
): SmartSavePlusState {
  const exchangeRate = convertCurrency(1, currency, localCurrency, exchangeRates);
  const currencyAmount = amount / exchangeRate;

  const holding: ProtectedCurrencyHolding = {
    id: `holding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    currency,
    amount: currencyAmount,
    bankId,
    purchaseDate: new Date().toISOString(),
    purchaseRate: exchangeRate,
    purchaseAmount: amount,
  };

  const transaction: CurrencyTransaction = {
    id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: "buy",
    currency,
    amount: currencyAmount,
    bankId,
    exchangeRate,
    localAmount: amount,
    date: new Date().toISOString(),
    description: `Bought ${currencyAmount.toFixed(2)} ${currency} using ${amount.toFixed(2)} ${localCurrency}`,
  };

  return {
    ...state,
    protectedHoldings: [...state.protectedHoldings, holding],
    currencyTransactions: [...state.currencyTransactions, transaction],
    totalProtectedValue: state.totalProtectedValue + amount,
  };
}

export function sellCurrency(
  holdingId: string,
  sellAmount: number,
  localCurrency: CurrencyCode,
  exchangeRates: ExchangeRateSnapshot | null,
  state: SmartSavePlusState
): { newState: SmartSavePlusState; returnedAmount: number } {
  const holding = state.protectedHoldings.find(h => h.id === holdingId);
  if (!holding || sellAmount > holding.amount) {
    throw new Error("Invalid holding or sell amount");
  }

  const currentExchangeRate = convertCurrency(1, localCurrency, holding.currency, exchangeRates);
  const returnedAmount = sellAmount * currentExchangeRate;

  const transaction: CurrencyTransaction = {
    id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: "sell",
    currency: holding.currency,
    amount: sellAmount,
    bankId: holding.bankId,
    exchangeRate: currentExchangeRate,
    localAmount: returnedAmount,
    date: new Date().toISOString(),
    description: `Sold ${sellAmount.toFixed(2)} ${holding.currency} for ${returnedAmount.toFixed(2)} ${localCurrency}`,
  };

  const updatedHoldings = state.protectedHoldings.map(h =>
    h.id === holdingId
      ? { ...h, amount: h.amount - sellAmount }
      : h
  ).filter(h => h.amount > 0.01); // Remove holdings with very small amounts

  const newTotalProtectedValue = calculateTotalProtectedValue(updatedHoldings, localCurrency, exchangeRates);

  return {
    newState: {
      ...state,
      protectedHoldings: updatedHoldings,
      currencyTransactions: [...state.currencyTransactions, transaction],
      totalProtectedValue: newTotalProtectedValue,
    },
    returnedAmount,
  };
}

export function getProtectedHoldingsByCurrency(
  holdings: ProtectedCurrencyHolding[],
  currency: CurrencyCode
): ProtectedCurrencyHolding[] {
  return holdings.filter(h => h.currency === currency);
}

export function getTotalByCurrency(
  holdings: ProtectedCurrencyHolding[],
  currency: CurrencyCode
): number {
  return holdings
    .filter(h => h.currency === currency)
    .reduce((total, h) => total + h.amount, 0);
}
