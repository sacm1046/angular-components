import { ChangeDetectionStrategy, Component, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { months, weekdays, shortMonths } from './constants';

@Component({
  selector: 'lib-datepicker',
  templateUrl: './datepicker.component.html',
  styleUrls: ['./datepicker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatepickerComponent implements OnInit, OnDestroy {
  @Input() control: FormControl = new FormControl("");
  @Input() minDate: Date | null = null;
  @Input() maxDate: Date | null = null;
  @Input() disableWeekends: boolean = false;
  @Input() holidays: string[] = [];

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
  isFitting = false
  isDisableBack = false
  isDisableFront = false
  calendarToday = new Date();
  currentMonth = this.today.getMonth();
  currentYear = this.today.getFullYear();
  selectedMonth = months[this.currentMonth];
  selectedYear = this.currentYear;

  get maxDiffDays() {
    if (this.maxDate) return this.diffDays(this.maxDate, this.today)
    return 3650
  }

  justNumber(valor: string) {
    const justNumbers = Number(valor.replace(/\D/g, ''));
    const limited = justNumbers < this.maxDiffDays ? justNumbers : this.maxDiffDays
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

  ngOnInit() {
    this.subscription.add(this.dateControl.valueChanges.subscribe(value => {
      this.dateControl.setValue(value, { emitEvent: false });
      const diffDays = this.diffDays(value, this.today).toString()
      const daysNumber = this.justNumber(diffDays)
      this.daysControl.setValue(daysNumber, { emitEvent: false });
      this.control.setValue(value)
    }))
    this.subscription.add(this.daysControl.valueChanges.subscribe(value => {
      const daysNumber = this.justNumber(value)
      const formattedDate = this.addDays(this.today, Number(daysNumber))
      this.daysControl.setValue(daysNumber, { emitEvent: false });
      this.dateControl.setValue(formattedDate, { emitEvent: false });
      this.control.setValue(formattedDate)
    }))
  }

  isHoliday(date: Date) {
    return this.holidays.find(
      (holiday) => new Date(holiday).toString() === date.toString()
    )
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
    const { value } = event.target as HTMLInputElement;
    const monthIndex = months.findIndex(
      (month: string) => month === value
    );
    this.currentMonth = monthIndex;
  }

  setDate(value: any) {
    this.dateControl.setValue(value)
    this.displayCalendar();
  }

  setDay(value: any) {
    this.dateControl.setValue(value)
    this.displayCalendar();
  }

  setDisableArrows() {
    if (this.minDate) {
      if (
        this.currentMonth - 1 < (this.minDate || this.today).getMonth() &&
        this.currentYear <= (this.minDate || this.today).getFullYear()
      ) {
        this.isDisableBack = true
      } else {
        this.isDisableBack = false
      }
    } else {
      this.isDisableBack = false
    }

    if (this.maxDate) {
      if (
        this.currentMonth + 1 > (this.maxDate || this.today).getMonth() &&
        this.currentYear > (this.minDate || this.today).getFullYear()
      ) {
        this.isDisableFront = true
      } else {
        this.isDisableFront = false
      }
    } else {
      this.isDisableFront = false
    }
  }

  handleCurrentDate({ month, replaceMonth = false, year }: { month: number, replaceMonth?: boolean, year?: number }) {
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

  handleDay(day: { number: number, weekday: number, date: Date }) {
    const current = day.date
    const weekday = day.weekday
    const currentF = this.formatDate(current)
    const dateF = this.formatDate(this.dateControl.value)
    const todayF = this.formatDate(this.today)
    const disableWeekends = this.disableWeekends ? weekday === 6 || weekday === 7 : false

    if (currentF === dateF) return 'datepicker__square--active'
    if (currentF === todayF) return 'datepicker__square--current'
    if (this.isHoliday(current)) return 'datepicker__square--disabled'
    if (
      disableWeekends ||
      this.minDate && current < this.minDate ||
      this.maxDate && current >= this.maxDate
    ) return 'datepicker__square--disabled'
    return ''
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
  }
}
