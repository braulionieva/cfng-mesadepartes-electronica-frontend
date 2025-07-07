import {
  AfterViewInit,
  Directive,
  Optional,
} from '@angular/core';
import { Calendar } from 'primeng/calendar';

@Directive({
  selector: '[calendarNumericInput]'
})
export class SetNumericInputCalendarDirective implements AfterViewInit {
  constructor(
    @Optional() private readonly calendar: Calendar
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      const inputEl = this.calendar?.inputfieldViewChild?.nativeElement
      if (inputEl) {
        inputEl.setAttribute('inputmode', 'numeric')
        // inputEl.setAttribute('pattern', '[0-9/]*')
        inputEl.setAttribute('type', 'text')
      }
    })
  }
}