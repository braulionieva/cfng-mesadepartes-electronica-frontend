import { AfterViewInit, Directive } from '@angular/core';
import { Calendar } from 'primeng/calendar';
import Inputmask from 'inputmask';

@Directive({
  selector: '[dateMask]'
})
export class DateMaskDirective implements AfterViewInit {

  constructor(private primeCalendar: Calendar) { }

  ngAfterViewInit() {
    const calendar = this.getHTMLInput();
    const im = new Inputmask( this.getDateMask() );
    im.mask(calendar);
  }

  getHTMLInput(): HTMLInputElement {
    return this.primeCalendar.el.nativeElement.querySelector('input');
  }

  getDateMask(): string {
    return '99/99/9999';
  }

}