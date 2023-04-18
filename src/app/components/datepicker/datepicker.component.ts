import { ChangeDetectionStrategy, Component, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { months, weekdays } from './constants';
import { addDays, diffDays, formatDate, getNextWorkDay, isHoliday, justNumber } from './helpers';

type ValidationTypeT = "error" | "warning"
type ValidationNameT = "startAt" | "endAt" | "workday"
interface ValidationI {
  type: ValidationTypeT
  name: ValidationNameT
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
  @Input() isCheckingWorkdays: string | null = null;
  @Input() validations: ValidationI[] = []

  get disableWeekends() {
    return typeof this.isDisableWeekends === "string"
  }
  get checkWorkdays() {
    return typeof this.isCheckingWorkdays === "string"
  }
  get minDate() {
    return addDays(this.today, this.startAt - 1)
  }
  get maxDate() {
    return addDays(this.today, this.endAt || 730)
  }
  get calendarValue() {
    return formatDate(this.dateControl.value)
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

  handleDayState(day: { number: number, weekday: number, date: Date }) {
    const current = day.date
    const weekday = day.weekday
    const currentF = formatDate(current)
    const dateF = formatDate(this.dateControl.value)
    const todayF = formatDate(this.today)
    const disableWeekends = this.disableWeekends ? weekday === 6 || weekday === 7 : false
    const isDisabled = disableWeekends || this.minDate && current < this.minDate || this.maxDate && current >= this.maxDate
    if (isDisabled && currentF === todayF) return 'datepicker__square--disabled datepicker__square--current'
    if (isDisabled) return 'datepicker__square--disabled'
    if (currentF === dateF) return 'datepicker__square--active'
    if (currentF === todayF) return 'datepicker__square--current'
    if (isHoliday(current, this.holidays)) return 'datepicker__square--disabled'
    return ''
  }

  calendarChange(value: Date) {
    this.dateControl.setValue(value, { emitEvent: false });
    const diff = diffDays(value, this.today).toString()
    const daysNumber = justNumber(diff)
    this.daysControl.setValue(daysNumber, { emitEvent: false });
    this.validation = null
    this.control.setValue(value)
  }

  daysChange(value: string) {
    let daysNumber = Number(justNumber(value))
    let isMaxWarning = false
    if (this.endAt && daysNumber > this.endAt) {
      daysNumber = this.endAt
      isMaxWarning = true
    }
    const formattedDate = addDays(this.today, daysNumber)
    const isMinWarning = diffDays(formattedDate, this.today) <= this.startAt - (this.startAt ? 0 : 1)
    const isWorkDayError = formatDate(getNextWorkDay(formattedDate, this.holidays)) !== formatDate(formattedDate)
    const validationFound = this.validations.find(({ name }: ValidationI) => {
      if (isMaxWarning) return name === "endAt"
      if (isMinWarning) return name === "startAt"
      if (isWorkDayError && this.checkWorkdays) return name === "workday"
      return
    })
    const controlValue = validationFound && validationFound.name !== "endAt" ? null : formattedDate
    this.validation = validationFound || null
    this.dateControl.setValue(controlValue, { emitEvent: false });
    this.control.setValue(controlValue)
    this.daysControl.setValue(daysNumber || "0", { emitEvent: false });
  }

  ngOnInit() {
    /* When calendar selection change */
    this.subscription.add(this.dateControl.valueChanges.subscribe(value => this.calendarChange(value)))
    /* When day input change */
    this.subscription.add(this.daysControl.valueChanges.subscribe(value => this.daysChange(value)))
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
  }
}
