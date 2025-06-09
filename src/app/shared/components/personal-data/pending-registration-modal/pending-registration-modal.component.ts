import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SLUG_PENDING_RESPONSE } from '@shared/helpers/slugs';
import { formatDateText } from '@shared/utils/utils';
//primeng
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from "primeng/dialog";

@Component({
    selector: 'complaint-specialized-modal',
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
            <span class="p-dialog-title">Denuncia pendiente por registrar</span>
        </div>
        <div class="p-dialog-header-icons">
            <button
                type="button"
                class="p-dialog-header-icon p-dialog-header-maximize p-link"
                (click)="ref.close()"
            >
                <span class="p-dialog-header-close-icon pi pi-times"></span>
            </button>
        </div>
    </div>
    <div class="flex flex-wrap justify-content-center my-2 mx-2">
        <div class="flex flex-wrap justify-content-center my-4">
            <b>{{ config.data.name }},</b> se verificó que usted tiene una denuncia pendiente por registrar
            del <b class="ml-1">{{ formatDate( config.data.date ) }}.</b>
        </div>
        <div class="flex justify-content-between my-3">
            <p-button
                styleClass="p-button-lg bg-secondary font-semibold mr-5"
                label="Eliminar y registrar una nueva"
                (onClick)="selectOption(responses.NEW)"
            />
            <p-button
                styleClass="p-button-lg bg-secondary font-semibold"
                icon="pi pi-arrow-right"
                iconPos="right"
                label="Continuar registro"
                (onClick)="selectOption(responses.CONTINUE)"
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
    `
    ]
})
export class PendingRegistrationModalComponent {

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