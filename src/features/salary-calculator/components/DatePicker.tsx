import React, { useState } from 'react';
import styles from './DatePicker.module.css';

interface DatePickerProps {
  selectedDates: string[]; // массив дат в формате YYYY-MM-DD
  onDatesChange: (dates: string[]) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selectedDates,
  onDatesChange,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Первый день месяца
  const firstDay = new Date(year, month, 1);
  // Преобразуем день недели: воскресенье (0) -> 7, остальные остаются как есть
  // Но нужно сдвинуть так, чтобы понедельник был 1: (day + 6) % 7 + 1
  // Или проще: если 0 (воскресенье) -> 7, иначе day
  let firstDayOfWeek = firstDay.getDay();
  if (firstDayOfWeek === 0) {
    firstDayOfWeek = 7; // Воскресенье -> последний день недели
  } // Понедельник (1) - Суббота (6) остаются как есть

  // Последний день месяца
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Названия дней недели
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isDateSelected = (dateStr: string): boolean => {
    return selectedDates.includes(dateStr);
  };

  const toggleDate = (dateStr: string) => {
    if (isDateSelected(dateStr)) {
      onDatesChange(selectedDates.filter(d => d !== dateStr));
    } else {
      onDatesChange([...selectedDates, dateStr].sort());
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const renderCalendarDays = () => {
    const days = [];
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    // Пустые ячейки до первого дня месяца
    for (let i = 1; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className={styles.emptyDay} />);
    }

    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDate(date);
      const isSelected = isDateSelected(dateStr);
      const isToday = todayYear === year && todayMonth === month && todayDate === day;

      days.push(
        <div
          key={day}
          className={`${styles.day} ${isSelected ? styles.selected : ''} ${isToday ? styles.today : ''}`}
          onClick={() => toggleDate(dateStr)}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={handlePrevMonth} className={styles.navButton}>
          ←
        </button>
        <h3 className={styles.monthTitle}>
          {monthNames[month]} {year}
        </h3>
        <button onClick={handleNextMonth} className={styles.navButton}>
          →
        </button>
      </div>
      <div className={styles.weekDays}>
        {weekDays.map((day) => (
          <div key={day} className={styles.weekDay}>
            {day}
          </div>
        ))}
      </div>
      <div className={styles.calendar}>
        {renderCalendarDays()}
      </div>
      {selectedDates.length > 0 && (
        <div className={styles.selectedInfo}>
          Выбрано дней: <strong>{selectedDates.length}</strong>
        </div>
      )}
    </div>
  );
};

