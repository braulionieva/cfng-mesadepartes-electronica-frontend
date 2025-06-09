import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SLUG_PENDING_RESPONSE } from '@shared/helpers/slugs';
import { formatDateText } from '@shared/utils/utils';
//primeng
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from "primeng/dialog";
import { CmpLibModule } from "ngx-mpfn-dev-cmp-lib";
import { obtenerIcono } from '@shared/utils/icon';
@Component({
    selector: 'complaint-specialized-modal',
    standalone: true,
    imports: [
        RippleModule,
        CommonModule,
        ButtonModule,
        DialogModule,
        CmpLibModule
    ],
    schemas: [
        CUSTOM_ELEMENTS_SCHEMA
    ],
    template: `
    <div class="p-2">
        <div class="p-1"></div>
        <div class="alert-content pl-2 pr-2">
            <span class="ml-1 mt-2 alert-icon">
                <fn-icon [ico]="obtenerIcono('iCheckCircle')" class="color-green" height="2.2rem"/>
            </span>
            <span class="ml-2 mt-2 text-2xl nfont-semibold color-green">Código de verificación enviado</span>
            <div class="w-150 ml-5 text-right">
                <span class="alert-icon cursor-pointer">
                    <i class="pi pi-times" (click)="ref.close()"></i>
                </span>
            </div>
        </div>
    </div>

    <div class="p-3 ml-1 text-center s-1-2rem">
        <div class="color-black2 lh-1-5 ml-4 mr-4">
            Hemos enviado el código de verificación al correo:
            <p class="lbl-center text-bold text-center mt-0" style="word-break:  break-word; text-align: justify;">{{ config.data.name }}</p>
            <p >Revise su bandeja de entrada para continuar.
        </div>
        <div class="flex flex-column md:flex-row justify-content-center mt-5 mb-2">
            <p-button (onClick)="ref.close()" label="Aceptar"
            styleClass="lbl-center p-button-lg bg-secondary font-semibold btn-adjust">
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
export class PendingVerificationModalComponent {

    public obtenerIcono = obtenerIcono
    public responses = SLUG_PENDING_RESPONSE

    constructor(
        public ref: DynamicDialogRef,
        public config: DynamicDialogConfig
    ) { }

    public selectOption(value: string): void {
        this.ref.close(value)
    }

    public formatDate(value: string): string {
        return formatDateText(value);
    }
}