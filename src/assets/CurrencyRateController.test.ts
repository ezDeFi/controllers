import 'isomorphic-fetch';
import { stub } from 'sinon';
import CurrencyRateController from './CurrencyRateController';

describe('CurrencyRateController', () => {
  it('should set default state', () => {
    const fetchExchangeRateStub = stub();
    const controller = new CurrencyRateController({}, undefined, fetchExchangeRateStub);
    expect(controller.state).toEqual({
      conversionDate: 0,
      conversionRate: 0,
      currentCurrency: 'usd',
      nativeCurrency: 'ETH',
      pendingCurrentCurrency: null,
      pendingNativeCurrency: null,
      usdConversionRate: null,
    });

    controller.destroy();
  });

  it('should initialize with initial state', () => {
    const fetchExchangeRateStub = stub();
    const existingState = { currentCurrency: 'rep' };
    const controller = new CurrencyRateController(existingState, undefined, fetchExchangeRateStub);
    expect(controller.state).toEqual({
      conversionDate: 0,
      conversionRate: 0,
      currentCurrency: 'rep',
      nativeCurrency: 'ETH',
      pendingCurrentCurrency: null,
      pendingNativeCurrency: null,
      usdConversionRate: null,
    });

    controller.destroy();
  });

  it('should poll and update rate in the right interval', async () => {
    const fetchExchangeRateStub = stub();
    const controller = new CurrencyRateController({}, { interval: 100 }, fetchExchangeRateStub);

    await new Promise<void>((resolve) => setTimeout(() => resolve(), 1));
    expect(fetchExchangeRateStub.called).toBe(true);
    expect(fetchExchangeRateStub.calledTwice).toBe(false);
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 150));
    expect(fetchExchangeRateStub.calledTwice).toBe(true);

    controller.destroy();
  });

  it('should clear previous interval', () => {
    const fetchExchangeRateStub = stub();
    const mock = stub(global, 'clearTimeout');
    const controller = new CurrencyRateController({}, { interval: 1337 }, fetchExchangeRateStub);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        controller.poll();
        expect(mock.called).toBe(true);
        mock.restore();

        controller.destroy();
        resolve();
      }, 100);
    });
  });

  it('should update exchange rate', async () => {
    const fetchExchangeRateStub = stub().resolves({ conversionRate: 10 });
    const controller = new CurrencyRateController({}, { interval: 10 }, fetchExchangeRateStub);
    expect(controller.state.conversionRate).toEqual(0);
    await controller.updateExchangeRate();
    expect(controller.state.conversionRate).toEqual(10);

    controller.destroy();
  });

  it('should update current currency', async () => {
    const fetchExchangeRateStub = stub().resolves({ conversionRate: 10 });
    const controller = new CurrencyRateController({}, { interval: 10 }, fetchExchangeRateStub);
    expect(controller.state.conversionRate).toEqual(0);
    await controller.setCurrentCurrency('CAD');
    expect(controller.state.conversionRate).toEqual(10);

    controller.destroy();
  });

  it('should update native currency', async () => {
    const fetchExchangeRateStub = stub().resolves({ conversionRate: 10 });
    const controller = new CurrencyRateController({}, { interval: 10 }, fetchExchangeRateStub);
    expect(controller.state.conversionRate).toEqual(0);
    await controller.setNativeCurrency('xDAI');
    expect(controller.state.conversionRate).toEqual(10);

    controller.destroy();
  });

  it('should add usd rate to state when includeUsdRate is configured true', async () => {
    const fetchExchangeRateStub = stub().resolves({});
    const controller = new CurrencyRateController(
      { currentCurrency: 'xyz' },
      { includeUsdRate: true },
      fetchExchangeRateStub,
    );

    await controller.updateExchangeRate();

    expect(fetchExchangeRateStub.alwaysCalledWithExactly('xyz', 'ETH', true)).toBe(true);

    controller.destroy();
  });
});
