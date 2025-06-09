import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SLUG_PENDING_RESPONSE } from '@shared/helpers/slugs';
import { formatDateText } from '@shared/utils/utils';
//primeng
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from "primeng/dialog";
import { obtenerIcono } from '@shared/utils/icon';
import { Router } from '@angular/router';

@Component({
    selector: 'document-verification-modal',
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
            <fn-icon [ico]="obtenerIcono('iAlertHexagonal')" height="2.3rem" class="color-yellow1"/>
        </span>
        <span class="ml-2 text-2xl nfont-semibold color-yellow1">Número del documento observado incorrecto</span>
        <div class="ml-5 text-right">
            <span class="alert-icon cursor-pointer">
                <i class="pi pi-times" (click)="ref.close()"></i>
            </span>
        </div>
    </div>
</div>

<div class="p-4 mt-2 ml-1">

    <div class="color-black2 lh-1-5">
    El número de documento que ingresó como observado, actualmente no se encuentra como observado. Por favor, ingrese un número de documento que le haya sido comunicado como observado.
    </div>

    <div class="flex md:flex-row justify-content-end align-items-center mt-5">
        <p-button (onClick)="confirmExitVerification()" label="Aceptar" styleClass="p-button-lg bg-secondary text-white font-semibold btn-adjust">
        </p-button>
    </div>
</div>


  `,
    styles: [
        `
        .icon-color{
            font-size: 1.3rem;
            margin-right: 10px;
        }
        .lbl-center{
            text-align: center;
        }
    `
    ]
})
export class DocumentVerificationModal {
    public obtenerIcono = obtenerIcono
    public responses = SLUG_PENDING_RESPONSE


    constructor(
        public readonly ref: DynamicDialogRef,
        public readonly config: DynamicDialogConfig,
        private readonly router: Router
    ) { }

    public selectOption(value: string): void {
        this.ref.close(value)
    }

    confirmExitVerification(): void {
        this.ref !== null && this.ref.close()

    }
    public formatDate(value: string): string {
        return formatDateText(value);
    }
}
