import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SLUG_CONFIRM_RESPONSE } from '@shared/helpers/slugs';
//primeng
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from "primeng/dialog";
import { HelperService } from '@shared/services/shared/helper.service';
import { AuthService } from '@shared/services/auth/auth.service';
import { TokenService } from '@shared/services/auth/token.service';
import { LOCALSTORAGE } from '@environments/environment';

const { VALIDATE_KEY } = LOCALSTORAGE;

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
            <span class="p-dialog-title">Tiempo de sesión expirado</span>
        </div>
    </div>
    <div class="flex flex-wrap justify-content-center my-2 mx-2">
        <div class="my-4 mx-4">
            {{ config.data.name }}, se ha superado el tiempo máximo para realizar la denuncia.
            <b>¿Desea continuar con el registro de la denuncia?</b>
        </div>
        <div class="flex justify-content-between my-3">
            <p-button
                styleClass="p-button surface-200 font-semibold text-primary mr-5"
                class="p-button-width"
                label="No, cancelar"
                [loading]="loadingCancel"
                [disabled]="loadingOK"
                (onClick)="selectOption(responses.CANCEL)"
            />
            <p-button
                styleClass="p-button bg-secondary font-semibold"
                class="p-button-width"
                label="Sí, continuar"
                [loading]="loadingOK"
                [disabled]="loadingCancel"
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
export class TimeExpiredModal {

    public responses = SLUG_CONFIRM_RESPONSE
    public loadingOK = false
    public loadingCancel = false

    constructor(
        public readonly ref: DynamicDialogRef,
        public readonly config: DynamicDialogConfig,
        private readonly authService: AuthService,
        private readonly tokenService: TokenService,
        private readonly helperService: HelperService,
    ) { }

    public selectOption(value: string): void {

        if (value === SLUG_CONFIRM_RESPONSE.OK) {
            this.loadingOK = true;
            this.authService.login(true).subscribe({
                next: resp => {
                    this.loadingOK = false
                    if (resp) {
                        //Update expired date
                        const validateToken = JSON.parse(this.tokenService.getItem(VALIDATE_KEY))
                        let newValidateToken = {
                            ...validateToken,
                            expirationDate: this.helperService.getExpiredTime()
                        }
                        this.tokenService.saveItem(VALIDATE_KEY, JSON.stringify(newValidateToken))
                        //Restart countdown
                        this.helperService.setwantsToStartCountDown(true)
                        this.ref.close()
                    }
                },
                error: () => this.loadingOK = false
            })
            return
        }

        if (value === SLUG_CONFIRM_RESPONSE.CANCEL) {
            this.loadingCancel = true;
            this.helperService.cancelComplaint(this.ref)
        }
    }
}