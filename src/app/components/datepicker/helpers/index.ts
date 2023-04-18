import { shortMonths } from "../constants";

export const addDays = (currentDate: Date, quantity: number) => {
  const date = new Date(currentDate)
  date.setDate(date.getDate() + quantity);
  return date
}

export const diffDays = (firstDate: Date, secondDate: Date) => {
  const msDiff = firstDate.getTime() - secondDate.getTime();
  return msDiff < 1 ? 0 : Math.trunc(msDiff / (1000 * 60 * 60 * 24)) + 1;
}

export const formatDate = (current: Date | null) => {
  if (!current) return ""
  const today = new Date(current)
  const day = today.getDate()
  const monthIndex = today.getMonth()
  const month = shortMonths[monthIndex]
  const year = today.getFullYear()
  return `${day} ${month} ${year}`
}

export const justNumber = (value: string) => value.replace(/\D/g, '');

export const isHoliday = (date: Date, holidays: string[]) => {
  return holidays.find((holiday) => formatDate(new Date(holiday)) === formatDate(date))
}

export const checkHolidayOrWeekend = (date: Date | string, holidays: string[]) => {
  date = new Date(date)
  const dayNumber = date.getDay();
  return {
    isHoliday: isHoliday(date, holidays),
    isWeekend: dayNumber === 0 || dayNumber === 6,
    tomorror: addDays(date, 1)
  }
}

export const getNextWorkDay = (current: Date | string, holidays: string[]): Date => {
  const { isWeekend, isHoliday, tomorror } = checkHolidayOrWeekend(current, holidays)
  return (isWeekend || isHoliday) ? getNextWorkDay(tomorror, holidays) : new Date(current)
}
