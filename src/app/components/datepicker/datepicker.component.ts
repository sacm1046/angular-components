import { ChangeDetectionStrategy, Component, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { months, weekdays, shortMonths } from './constants';

type ValidationTypeT = "error" | "warning"
type ValidationNameT = "startAt" | "endAt" | "workday"
interface ValidationI {
  type: ValidationTypeT
  name: ValidationNameT
  value?: number
  message?: string
}

interface CurrentDateI {
  month: number
  replaceMonth?: boolean
  year?: number
}

@Component({
  selector: 'lib-datepicker',
  templateUrl: './datepicker.component.html',
  styleUrls: ['./datepicker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatepickerComponent implements OnInit, OnDestroy {
  @Input() control: FormControl = new FormControl("");
  @Input() startAt: number = 0;
  @Input() endAt: number = 0;
  @Input() holidays: string[] = [];
  @Input() isDisableWeekends: string | null = null;
  validations: ValidationI[] = []


  get disableWeekends() {
    return typeof this.isDisableWeekends === "string"
  }
  get minDate() {
    return this.addDays(this.today, this.startAt)
  }
  get maxDate() {
    return this.addDays(this.today, this.endAt || 730)
  }
  get validationType() {
    console.log(this.validation)
    if (this.validation) return this.validation.type
    return null
  }

  @HostListener('document:click', ['$event'])
  clickout(event: PointerEvent) {
    const targetElement = event.target as HTMLElement;
    if (targetElement.id !== 'datepicker__calendar' && !targetElement.closest('#datepicker__calendar')) {
      this.showCalendar = false
    }
  }

  dateControl: FormControl = new FormControl(null);
  daysControl: FormControl = new FormControl(null);
  subscription: Subscription = new Subscription();
  today = new Date();
  showCalendar: Boolean = false;
  weekdays = weekdays;

  /* Calendar controls */
  validation: ValidationI | null = null;
  isFitting = false
  isDisableBack = false
  isDisableFront = false
  calendarToday = new Date();
  currentMonth = this.today.getMonth();
  currentYear = this.today.getFullYear();
  selectedMonth = months[this.currentMonth];
  selectedYear = this.currentYear;

  justNumber(valor: string) {
    const justNumbers = Number(valor.replace(/\D/g, ''));
    const limited = justNumbers < this.endAt ? justNumbers : this.endAt
    return limited.toString()
  }

  addDays(currentDate: Date, quantity: number) {
    const date = new Date(currentDate)
    date.setDate(date.getDate() + quantity);
    return date
  }

  diffDays(firstDate: Date, secondDate: Date) {
    const msDiff = firstDate.getTime() - secondDate.getTime();
    return msDiff < 1 ? 0 : Math.trunc(msDiff / (1000 * 60 * 60 * 24)) + 1;
  }

  isHoliday(date: Date) {
    return this.holidays.find(
      (holiday) => new Date(holiday).toString() === date.toString()
    )
  }

  checkHolidayOrWeekend(date: Date | string) {
    date = new Date(date)
    const dayNumber = date.getDay();
    return {
      isHoliday: this.isHoliday(date),
      isWeekend: dayNumber === 0 || dayNumber === 6,
      tomorror: this.addDays(date, 1)
    }
  }

  getNextWorkDay(current: Date | string): Date {
    const { isWeekend, isHoliday, tomorror } = this.checkHolidayOrWeekend(current)
    return (isWeekend || isHoliday) ? this.getNextWorkDay(tomorror) : new Date(current)
  }

  createCurrentMonth(month: string, year: number) {
    const monthIndex = months.findIndex((_month) => _month === month);
    const monthDays = new Date(year, monthIndex + 1, 0).getDate();
    const result = [...Array(monthDays).keys()].map((day: number) => {
      const current = new Date(year, monthIndex, day + 1);
      const weekday = current.getDay()
      return {
        number: current.getDate(),
        weekday: weekday === 0 ? 7 : weekday,
        date: current,
      };
    });
    this.isFitting = result[0].weekday > 2
    return result
  }

  setMonth(event: Event) {
    const { value } = event.target as HTMLInputElement
    const monthIndex = months.findIndex((month: string) => month === value)
    this.currentMonth = monthIndex
  }

  setDate(value: Date) {
    this.dateControl.setValue(value)
    this.displayCalendar();
  }

  setDisableArrows() {
    const minCondition = this.minDate && (this.currentMonth - 1 < (this.minDate || this.today).getMonth() &&
      this.currentYear <= (this.minDate || this.today).getFullYear())
    this.isDisableBack = minCondition

    const maxCondition = this.maxDate && (this.currentMonth + 1 > (this.maxDate || this.today).getMonth() &&
      this.currentYear > (this.minDate || this.today).getFullYear())
    this.isDisableFront = maxCondition
  }

  handleCurrentDate({ month, replaceMonth = false, year }: CurrentDateI) {
    const newMonth = replaceMonth ? month : this.calendarToday.getMonth() + month
    this.calendarToday.setMonth(newMonth);
    if (year) this.calendarToday.setFullYear(year)
    this.currentMonth = this.calendarToday.getMonth();
    this.currentYear = this.calendarToday.getFullYear()
    this.selectedMonth = months[this.currentMonth];
    this.selectedYear = this.currentYear;
    this.setDisableArrows()
  }

  onClickArrow(isRight: boolean) {
    const month = isRight ? 1 : -1
    this.handleCurrentDate({ month })
  }

  displayCalendar() {
    this.showCalendar = !this.showCalendar;
    if (this.showCalendar) {
      const selected = this.dateControl.value || this.today
      this.handleCurrentDate({ month: selected.getMonth(), replaceMonth: true, year: selected.getFullYear() })
    }
  }

  formatDate(current: Date | null) {
    if (!current) return ""
    const today = new Date(current)
    const day = today.getDate()
    const monthIndex = today.getMonth()
    const month = shortMonths[monthIndex]
    const year = today.getFullYear()
    return `${day} ${month} ${year}`
  }

  handleDayState(day: { number: number, weekday: number, date: Date }) {
    const current = day.date
    const weekday = day.weekday
    const currentF = this.formatDate(current)
    const dateF = this.formatDate(this.dateControl.value)
    const todayF = this.formatDate(this.today)
    const disableWeekends = this.disableWeekends ? weekday === 6 || weekday === 7 : false
    const isDisabled = disableWeekends || this.minDate && current < this.minDate || this.maxDate && current >= this.maxDate
    if (isDisabled && currentF === todayF) return 'datepicker__square--disabled datepicker__square--current'
    if (isDisabled) return 'datepicker__square--disabled'
    if (currentF === dateF) return 'datepicker__square--active'
    if (currentF === todayF) return 'datepicker__square--current'
    if (this.isHoliday(current)) return 'datepicker__square--disabled'
    return ''
  }

  handleValidations(isWarning: boolean = false, isError: boolean = false) {
    const validationValue: ValidationI = {
      type: isWarning ? "warning" : "error",
      name: "workday",
    }
    this.validation = isError || isWarning ? validationValue : null
  }

  ngOnInit() {
    /* When calendar selection change */
    this.subscription.add(this.dateControl.valueChanges.subscribe(value => {
      this.dateControl.setValue(value, { emitEvent: false });
      const diffDays = this.diffDays(value, this.today).toString()
      const daysNumber = this.justNumber(diffDays)
      this.daysControl.setValue(daysNumber, { emitEvent: false });
      this.control.setValue(value)
      this.handleValidations()
    }))
    /* When day input change */
    this.subscription.add(this.daysControl.valueChanges.subscribe(value => {
      const daysNumber = this.justNumber(value)
      const formattedDate = this.addDays(this.today, Number(daysNumber))

      const isWarning = this.diffDays(formattedDate, this.today) <= this.startAt + 1
      const isError = this.formatDate(this.getNextWorkDay(formattedDate)) !== this.formatDate(formattedDate)

      if (isError || isWarning) {
        this.handleValidations(isWarning, isError)
        this.dateControl.setValue(null, { emitEvent: false });
        this.control.setValue(null)
      } else {
        this.handleValidations()
        this.dateControl.setValue(formattedDate, { emitEvent: false });
        this.control.setValue(formattedDate)
      }
      this.daysControl.setValue(daysNumber, { emitEvent: false });

    }))
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
  }
}
