import { NgModule } from '@angular/core';
import { DateMaskDirective } from './date-mask.directive';

@NgModule({
    declarations: [ DateMaskDirective ],
    exports: [ DateMaskDirective ]
})
export class DateMaskModule { }