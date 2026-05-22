import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddFoodSheet } from '@/components/kost/AddFoodSheet';

jest.mock('@/components/ui/Modal', () => ({
  Modal: ({ open, children, title }: { open: boolean; children: React.ReactNode; title: string }) =>
    open ? <div><h2>{title}</h2>{children}</div> : null,
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

const defaultProps = {
  open: true,
  mealLabel: 'Lunch',
  onAdd: jest.fn(),
  onClose: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AddFoodSheet', () => {
  it('visar textfält när sheetet öppnas', () => {
    render(<AddFoodSheet {...defaultProps} />);
    expect(screen.getByPlaceholderText(/Vad åt du/)).toBeInTheDocument();
    expect(screen.getByText('Analysera')).toBeInTheDocument();
  });

  it('Analysera-knappen är inaktiverad när fältet är tomt', () => {
    render(<AddFoodSheet {...defaultProps} />);
    expect(screen.getByText('Analysera')).toBeDisabled();
  });

  it('Analysera-knappen aktiveras när text skrivs in', () => {
    render(<AddFoodSheet {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Vad åt du/), {
      target: { value: 'kycklingfilé' },
    });
    expect(screen.getByText('Analysera')).not.toBeDisabled();
  });

  it('visar portionssteg efter lyckat API-anrop', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        name: 'Kycklingfilé',
        kcalPer100g: 165,
        proteinPer100gG: 31,
        fatPer100gG: 3.6,
        carbsPer100gG: 0,
      }),
    });

    render(<AddFoodSheet {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Vad åt du/), {
      target: { value: 'kycklingfilé' },
    });
    fireEvent.click(screen.getByText('Analysera'));

    await waitFor(() => {
      expect(screen.getByText('Kycklingfilé')).toBeInTheDocument();
    });

    expect(screen.getByText('Liten')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
    expect(screen.getByText('Stor')).toBeInTheDocument();
  });

  it('visar felmeddelande om API-anropet misslyckas', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    render(<AddFoodSheet {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Vad åt du/), {
      target: { value: 'kycklingfilé' },
    });
    fireEvent.click(screen.getByText('Analysera'));

    await waitFor(() => {
      expect(screen.getByText(/Kunde inte tolka/)).toBeInTheDocument();
    });
  });

  it('anropar onAdd med korrekt FoodItem vid Lägg till med Normal-portion', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        name: 'Kycklingfilé',
        kcalPer100g: 165,
        proteinPer100gG: 31,
        fatPer100gG: 3.6,
        carbsPer100gG: 0,
      }),
    });

    const onAdd = jest.fn();
    render(<AddFoodSheet {...defaultProps} onAdd={onAdd} />);
    fireEvent.change(screen.getByPlaceholderText(/Vad åt du/), {
      target: { value: 'kycklingfilé' },
    });
    fireEvent.click(screen.getByText('Analysera'));

    await waitFor(() => screen.getByText('Kycklingfilé'));

    fireEvent.click(screen.getByText('Normal'));
    fireEvent.click(screen.getByText('Lägg till'));

    expect(onAdd).toHaveBeenCalledWith({
      name: 'Kycklingfilé',
      weightG: 300,
      kcal: 495,
      proteinG: 93,
      fatG: 10.8,
      carbsG: 0,
    });
  });
});
