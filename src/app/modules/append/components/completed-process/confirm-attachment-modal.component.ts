import { CommonModule } from '@angular/common';
import { SLUG_CONFIRM_RESPONSE } from '@shared/helpers/slugs';
//primeng
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from "primeng/dialog";
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HelperService } from '@shared/services/shared/helper.service';
import { Router } from '@angular/router';

@Component({
    selector: 'confirm-attachment-modal',
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
            <span class="p-dialog-title">Está a punto de salir de Presentar Documento </span>
        </div>
    </div>
    <div class="flex flex-wrap justify-content-center my-2 mx-2">
        <div class="my-4 mx-4"> Todos los datos que ha ingresado se perderán y será redirigido a la página principal. Por favor, confirme si desea salir del Presentar Documento.
            <!--{{ config.data.name ? config.data.name + ', esta' : 'Esta '}} acción no es reversible.
            <b>¿Desea cancelar el {{isComplaintProcess?'registro':'seguimiento'}} de la denuncia?</b-->
        </div>
        <div class="flex justify-content-between my-3">
            <p-button
                styleClass="p-button surface-200 font-semibold text-primary mr-5"
                class="p-button-width"
                label="cancelar"
                [disabled]="loading"
                (onClick)="selectOption(responses.CANCEL)"
            />
            <p-button
                styleClass="p-button bg-secondary font-semibold"
                class="p-button-width"
                label="Sí, salir"
                [loading]="loading"
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
        .p-button-width button{
            width: 115px !important;
        }
    `
    ]
})
export class ConfirmAttachmentModal {

    public responses = SLUG_CONFIRM_RESPONSE
    public loading: boolean = false

    constructor(
        public readonly ref: DynamicDialogRef,
        public readonly config: DynamicDialogConfig,
        public readonly helperService: HelperService,
        private readonly router: Router
    ) { }


    public selectOption(value: string): void {
        if (value === this.responses.CANCEL) {

            this.ref.close()
            return
        }


        this.helperService.cancelTracking(this.ref)

    }

}
