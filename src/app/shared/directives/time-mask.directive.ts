import { AfterViewInit, Directive } from '@angular/core'
import { Calendar } from 'primeng/calendar'
import Inputmask from 'inputmask'

@Directive({
  selector: '[timeMask]',
  standalone: true
})
export class TimeMaskDirective implements AfterViewInit {

  constructor(private primeCalendar: Calendar) { }

  ngAfterViewInit() {
    const input = this.getHTMLInput()
    const im = new Inputmask(this.getTimeMask())
    im.mask(input)
  }

  getHTMLInput(): HTMLInputElement {
    return this.primeCalendar.el.nativeElement.querySelector('input')
  }

  getTimeMask(): string {
    return '99:99'
  }

}