import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
//primeng
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'complaint-specialized-modal',
  standalone: true,
  imports: [
    RippleModule,
    CommonModule
  ],
  templateUrl: './specialized-modal.component.html',
})
export class SpecializedModalComponent {

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) { }

}
