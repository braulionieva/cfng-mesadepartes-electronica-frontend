import {Component, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {SLUG_PENDING_RESPONSE} from '@shared/helpers/slugs';
//primeng
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {RippleModule} from 'primeng/ripple';
import {ButtonModule} from 'primeng/button';
import {DialogModule} from "primeng/dialog";
import {obtenerIcono} from '@shared/utils/icon';
import {CmpLibModule} from "ngx-mpfn-dev-cmp-lib";

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
    <div class="p-4 mt-2 ml-1">
      <div class="text-center">
        <span class="ml-2 alert-icon">
          <fn-icon [ico]="obtenerIcono('iAlertHexagonal')" height="4rem" class="color-yellow1"/>
        </span>
      </div>
      <div *ngIf="errorType === 1" class="color-black2 lh-1-5 wrap-text">
        Hubo un problema técnico. Por favor, intente nuevamente.
      </div>
      <div *ngIf="errorType === 2" class="color-black2 lh-1-5 wrap-text">
        <p>Se ha producido un error inesperado y lamentablemente no fue posible guardar la información ingresada. Entendemos el tiempo y esfuerzo que ha dedicado al completar este formulario y ofrecemos nuestras disculpas por los inconvenientes ocasionados.</p>
        <p>Estamos trabajando para mejorar el sistema y prevenir este tipo de situaciones en el futuro.</p>
        <p>Le ofrecemos estas otras alternativas</p>
        <ol>
          <li>Presente su denuncia de manera presencial en la comisaria de su distrito.</li>
          <li>Presente su denuncia de manera presencial en la mesa única de partes del distrito fiscal de su
            jurisdicción
          </li>
        </ol>
      </div>
      <div *ngIf="errorType === 3" class="color-black2 lh-1-5 wrap-text">
        <span>Hubo un problema técnico. Por favor, inténtelo más tarde o utilice una de las siguientes alternativas.</span>
        <ol>
          <li>Presente su denuncia de manera presencial en la comisaria de su distrito.</li>
          <li>Presente su denuncia de manera presencial en la mesa única de partes del distrito fiscal de su
            jurisdicción
          </li>
        </ol>
      </div>

      <div class="flex md:flex-row justify-content-center align-items-center mt-5"
           [ngClass]="{'justify-content-between': [1,2].includes(errorType)}">
        <p-button (onClick)="onCancelButtonClick()"
                  [label]="'Ir a la página de inicio'"
                  styleClass="bg-white text-primary font-semibold btn-adjust-involment"
                  [ngStyle]="{'padding': '0.5rem'}">
        </p-button>

        <p-button *ngIf="[1,2].includes(errorType)" (onClick)="onPrimaryButtonClick()"
                  [label]="'Volver a intentar'"
                  [disabled]="errorType === 2"
                  styleClass="bg-secondary text-white font-semibold btn-adjust-involment"
                  [ngStyle]="{'padding': '0.5rem'}">
        </p-button>
      </div>
    </div>


  `,
  styles: [
    `
      .icon-color {
        font-size: 1.3rem;
        margin-right: 10px;
      }

      .lbl-center {
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
export class ScenePlaceModalComponent {
  public obtenerIcono = obtenerIcono
  public responses = SLUG_PENDING_RESPONSE
  public message: string;
  public showTwoButtons: boolean = true;
  public onCancelButtonClick: () => void;
  public onPrimaryButtonClick: () => void;
  public errorType: number;

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private router: Router
  ) {
    this.errorType = this.config.data?.errorType || 1;
    this.onCancelButtonClick = this.config.data?.onCancelButtonClick || (() => {
      this.ref.close();
      this.router.navigate(['/']);
    });
    this.onPrimaryButtonClick = this.config.data?.onPrimaryButtonClick || (() => this.ref.close(true));
  }
}
