import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SLUG_CONFIRM_RESPONSE } from '@shared/helpers/slugs';
//primeng
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from "primeng/dialog";
import { Router } from '@angular/router';

@Component({
  selector: 'confirmation-modal',
  standalone: true,
  imports: [
    RippleModule,
    CommonModule,
    ButtonModule,
    DialogModule,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  template: `
    <div class="p-dialog-header w-full bg-secondary-header">
        <div class="flex align-items-center">
            <i class="pi pi-info-circle icon-color"></i>
            <span class="p-dialog-title">{{title}}</span>
        </div>
        <div class="p-dialog-header-icons">
            <button
                type="button"
                class="p-dialog-header-icon p-dialog-header-maximize p-link p-close-icon"
                (click)="ref.close()"
            >
                <span class="p-dialog-header-close-icon pi pi-times"></span>
            </button>
        </div>
    </div>
    <div class="flex flex-wrap justify-content-center my-2 mx-2">
        <div class="my-4">
            {{ message }}
            <br>
            Esta acción no podrá revertirse.
            <b>{{confirmationQuestion}}</b>
        </div>
        <div class="flex justify-content-between my-3">
            <p-button
                styleClass="p-button surface-200 font-semibold text-primary mr-5"
                class="p-button-width"
                label="Cancelar"
                (onClick)="selectOption(responses.CANCEL)"
            />
            <p-button
                styleClass="p-button bg-secondary font-semibold"
                class="p-button-width"
                label="Sí, registrar"
                (onClick)="selectOption(responses.OK)"
            />
        </div>
    </div>
  `,
  styles: [
    `
        .bg-secondary-header{
            background-color: #f7eed4;
            color: #d9a927;
        }
        .icon-color{
            color: #d9a927;
            font-size: 1.6rem;
            transform: rotate(180deg);
            margin-right: 10px;
        }
        .p-close-icon{
            box-shadow: none !important;
            color: #2a2927 !important;
        }
        .p-button-width button{
            width: 115px !important;
        }
    `
  ]
})
export class ConfirmationModal {
  public responses = SLUG_CONFIRM_RESPONSE

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

  get message(): string {
    return (
      this.isComplaintProcess
        ? `${this.config.data.name}, está a punto de registrar la denuncia ingresada.`
        : `${this.config.data.name}, esta a punto de registrar los documentos cargados.`
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
