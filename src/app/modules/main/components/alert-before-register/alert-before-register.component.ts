import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SLUG_CONFIRM_RESPONSE } from '@shared/helpers/slugs';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-alert-before-register',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './alert-before-register.component.html',
  styleUrls: ['./alert-before-register.component.scss']
})
export class AlertBeforeRegisterComponent {

  public responses = SLUG_CONFIRM_RESPONSE

  public readonly ref = inject(DynamicDialogRef)

  public selectOption(value: string): void {
    this.ref.close(value)
  }

}