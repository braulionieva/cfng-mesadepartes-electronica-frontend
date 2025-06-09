import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { CommonModule } from '@angular/common';

//primeng
import { ButtonModule } from "primeng/button";

//mpfn
import { CmpLibModule } from "ngx-mpfn-dev-cmp-lib";

import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

import { SLUG_CONFIRM_RESPONSE } from '@shared/helpers/slugs';
import { AlertComponent } from '@shared/components/alert/alert.component';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [
    CommonModule, ButtonModule, CmpLibModule, AlertComponent
  ],
  templateUrl: './confirmation-modal.component.html',
})
export class ConfirmationModalComponent {

  public responses = SLUG_CONFIRM_RESPONSE

  protected messagesDuplicated = {
    severity: 'error',
    isVerification: false,
    custom: true,
    detail: 'Registrar muchas denuncias con la misma información ocasionaría retraso en el proceso de investigación.'
  }

  constructor(
    public readonly ref: DynamicDialogRef,
    public readonly config: DynamicDialogConfig,
    private readonly router: Router
  ) { }

  get isComplaintProcess(): boolean {
    return this.router.url.includes('realizar-denuncia')
  }

  get title(): string {
    return (
      this.isComplaintProcess
        ? 'Está a punto de registrar la denuncia'
        : 'Está a punto de registrar los documentos'
    )
  }

  get nameComplete(): string {
    return (
      `${this.config.data.name}`
    )
  }

  get denunciaDuplicada(): string {
    return (
      `${this.config.data.duplicada}`
    )
  }

  get nroCaso(): string {
    return (
      `${this.config.data.caso}`
    )
  }

  get confirmationQuestion(): string {
    return (
      this.isComplaintProcess
        ? '¿Desea registrar la denuncia?'
        : '¿Desea continuar con el registro?'
    )
  }

  public selectOption(value: string): void {
    this.ref.close(value)
  }


}
