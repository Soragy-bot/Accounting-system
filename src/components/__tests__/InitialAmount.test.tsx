import { render, screen, fireEvent } from '@testing-library/react';
import { InitialAmount } from '../InitialAmount';

describe('InitialAmount', () => {
  const mockOnSetInitialAmount = jest.fn();

  beforeEach(() => {
    mockOnSetInitialAmount.mockClear();
  });

  it('отображает начальную сумму', () => {
    render(<InitialAmount initialAmount={1000} onSetInitialAmount={mockOnSetInitialAmount} />);
    expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
  });

  it('вызывает onSetInitialAmount при отправке формы', () => {
    render(<InitialAmount initialAmount={0} onSetInitialAmount={mockOnSetInitialAmount} />);
    
    const input = screen.getByLabelText(/введите начальную сумму/i);
    const button = screen.getByLabelText(/установить начальную сумму/i);

    fireEvent.change(input, { target: { value: '5000' } });
    fireEvent.click(button);

    expect(mockOnSetInitialAmount).toHaveBeenCalledWith(5000);
  });

  it('не вызывает onSetInitialAmount для отрицательных значений', () => {
    render(<InitialAmount initialAmount={0} onSetInitialAmount={mockOnSetInitialAmount} />);
    
    const input = screen.getByLabelText(/введите начальную сумму/i);
    const button = screen.getByLabelText(/установить начальную сумму/i);

    fireEvent.change(input, { target: { value: '-100' } });
    fireEvent.click(button);

    expect(mockOnSetInitialAmount).not.toHaveBeenCalled();
  });

  it('отображает текущую начальную сумму, если она больше 0', () => {
    render(<InitialAmount initialAmount={1500} onSetInitialAmount={mockOnSetInitialAmount} />);
    expect(screen.getByText(/текущая начальная сумма/i)).toBeInTheDocument();
    expect(screen.getByText(/1500.00 ₽/i)).toBeInTheDocument();
  });
});

