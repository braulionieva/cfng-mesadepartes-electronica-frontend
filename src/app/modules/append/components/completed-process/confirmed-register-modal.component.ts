import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SLUG_CONFIRM_RESPONSE } from '@shared/helpers/slugs';
//primeng
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from "primeng/dialog";
import { Router } from '@angular/router';
import { obtenerIcono } from '@shared/utils/icon';
@Component({
  selector: 'confirmed-register-modal',
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
 <div class="bg-yellow-ligth-alert">
    <div class="p-1"></div>
    <div class="alert-content p-2">
        <span class="ml-2 alert-icon">
        <i class="pi pi-exclamation-circle color-yellow1 s-2rem"></i>
            <!--fn-icon [ico]="obtenerIcono('iAlertHexagonal')" height="2.3rem" class="color-yellow1"/-->

        </span>
        <span class="ml-2 text-2xl nfont-semibold color-yellow1 mpe_modal_titulo">Está a punto de registrar el documento </span>
        <div class="ml-5 text-right">
            <span class="alert-icon cursor-pointer">
                <i class="pi pi-times" (click)="ref.close()"></i>
            </span>
        </div>
    </div>
</div>

<div class="p-4 mt-2 ml-1">

    <div class="color-black2 lh-1-5 mpe_modal_descripcion">
    <strong>{{completeName| titlecase}},</strong> esta a punto de registrar el documento cargado.
    </div>
    <div>Esta acción no podrá revertirse.¿Desea continuar con el registro?</div>

    <div class="flex md:flex-row justify-content-between align-items-center mt-5">
        <p-button (onClick)="selectOption(responses.CANCEL)" label="Cancelar"
            styleClass="p-button-lg surface-200 text-primary font-bold btn-adjust">
        </p-button>

        <p-button (onClick)="selectOption(responses.OK)" label="Sí, registrar" styleClass="p-button-lg bg-secondary text-white font-semibold btn-adjust">
        </p-button>
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
export class ConfirmedRegisterModal {
  public obtenerIcono = obtenerIcono
  public responses = SLUG_CONFIRM_RESPONSE
  public completeName: string
  constructor(
    public readonly ref: DynamicDialogRef,
    public readonly config: DynamicDialogConfig,
    private readonly router: Router
  ) {
    this.completeName = this.config.data.name
  }

  get isComplaintProcess(): boolean {
    return this.router.url.includes('realizar-denuncia')
  }



  get message(): string {
    return (
      this.isComplaintProcess
        ? `${this.config.data.name}, está a punto de registrar la denuncia ingresada.`
        : `${this.config.data.name}, esta a punto de registrar el documento cargado.`
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
