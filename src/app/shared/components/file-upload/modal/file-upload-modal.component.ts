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
import { CmpLibModule } from "ngx-mpfn-dev-cmp-lib";

@Component({
  selector: 'document-verification-modal',
  standalone: true,
  imports: [
    RippleModule,
    CommonModule,
    ButtonModule,
    DialogModule,
    CmpLibModule,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  template: `

<div>
    <div class="p-1"></div>
    <div class="alert-content p-2 pt-3">
        <span class="ml-2 alert-icon">
            <fn-icon [ico]="obtenerIcono('iAlertHexagonal')" height="2.3rem" class="color-yellow1"/>
        </span>
        <span class="ml-2 text-2xl nfont-semibold color-yellow1 mpe_modal_titulo">{{title}}</span>
    </div>
</div>

<div class="px-4 pb-4 pt-2 ml-1">
    <div class="color-black2 lh-1-5 wrap-text" [innerHTML]="message"></div>

    <div class="flex md:flex-row justify-content-center align-items-center mt-5" [ngClass]="{'justify-content-between': showTwoButtons}">
        <p-button *ngIf="showTwoButtons"
                  (onClick)="onCancelButtonClick()"
                  [label]="cancelButtonLabel"
                  styleClass="p-button-lg surface-200 text-primary font-bold btn-adjust">
        </p-button>
        <p-button (onClick)="onPrimaryButtonClick()"
                  [label]="primaryButtonLabel"
                  styleClass="p-button-lg bg-secondary text-white font-semibold btn-adjust">
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
        .wrap-text {
          word-break: break-word;
          white-space: normal;
          overflow-wrap: break-word;
        }
    `
  ]
})
export class FileUploadModalComponent {

  public obtenerIcono = obtenerIcono
  public responses = SLUG_PENDING_RESPONSE
  public title: string;
  public message: string;
  public showTwoButtons: boolean = false;
  public cancelButtonLabel: string = 'Cancelar';
  public primaryButtonLabel: string = 'Continuar';
  public onCancelButtonClick: () => void;
  public onPrimaryButtonClick: () => void;

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private router: Router
  ) {
    this.title = this.config.data?.title || 'Error';
    this.message = this.config.data?.message || 'Ha ocurrido un error';
    this.showTwoButtons = this.config.data?.showTwoButtons || false;
    this.cancelButtonLabel = this.config.data?.cancelButtonLabel || 'Cancelar';
    this.primaryButtonLabel = this.config.data?.primaryButtonLabel || 'Continuar';
    this.onCancelButtonClick = this.config.data?.onCancelButtonClick || (() => this.ref.close());
    this.onPrimaryButtonClick = this.config.data?.onPrimaryButtonClick || (() => this.ref.close(true));
  }

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
