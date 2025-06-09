import { Component, Input, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SLUG_CONFIRM_RESPONSE } from '@shared/helpers/slugs';
//primeng
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from "primeng/dialog";
import { HelperService } from '@shared/services/shared/helper.service';
import { Router } from '@angular/router';
import { CmpLibModule } from "ngx-mpfn-dev-cmp-lib";
import { obtenerIcono } from '@shared/utils/icon';

@Component({
  selector: 'confirmation-found-modal',
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
    <div class="p-dialog-header w-full bg-secondary-header">
        <div class="alert-content p-1">
            <span class="ml-1 alert-icon">
              <fn-icon [ico]="obtenerIcono('iCheckCircle')" class="color-green" height="2.2rem"/>
            </span>
            <span class="ml-2 text-2xl nfont-semibold color-green">Número de caso validado</span>
            <div class="w-150 ml-8 text-right color-black">
                <span class="alert-icon cursor-pointer">
                    <i class="pi pi-times" (click)="ref.close()"></i>
                </span>
            </div>
        </div>
    </div>
    <div class="flex flex-wrap justify-content-center my-2 mx-2 mt-2">
        <div class="mt-2"> Ud. se encuentra en calidad de <strong>{{tipoParte.toUpperCase()}}</strong>, en el caso N°:
        </div>
        <div class="flex flex-wrap justify-content-center p-2 font-bold text-3xl">
                  {{codigoCaso}}
        </div>
        <div class=""> Por favor continúe con el {{istracking?'seguimiento del caso':'registro de su documento'}}.
        </div>

    </div>

    <div class="flex flex-column md:flex-row justify-content-between align-items-center m-5">
        <p-button
            styleClass="p-button-lg surface-200 text-primary font-bold btn-adjust"
            class="p-button-width"
            label="Cancelar"
            [disabled]="loading"
            (onClick)="selectOption(responses.CANCEL)"
        />
        <p-button
            styleClass="p-button-lg bg-secondary text-white font-semibold btn-adjust pr-4"
            [loading]="loading"
            (onClick)="selectOption(responses.OK)">
            <span>Continuar</span>
                <fn-icon [ico]="obtenerIcono('iArrowRight')" class="ml-2" />
          </p-button>
    </div>
  `,
  styles: [
    `
        .bg-secondary-header{
            background-color: #d8f4de;
            color: #3cc85a;
        }
        .icon-color{
            color: #3cc85a;
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
export class ConfirmCaseFoundModal implements OnInit {
  public obtenerIcono = obtenerIcono
  @Input() public codigoCaso;
  @Input() public tipoParte;
  @Input() public istracking;
  TYPELAWYER = 'ABOGADO'
  public responses = SLUG_CONFIRM_RESPONSE
  public loading: boolean = false

  constructor(
    public readonly ref: DynamicDialogRef,
    public readonly config: DynamicDialogConfig,
    public readonly helperService: HelperService,
    private readonly router: Router
  ) { }
  ngOnInit(): void {

    this.codigoCaso = this.config.data.codigoCaso;
    this.tipoParte = this.config.data.tipoParte ?? this.TYPELAWYER;
    this.istracking = this.config.data.istracking;

  }


  public selectOption(value: string): void {
    if (value === this.responses.OK) {
      this.ref.close(this.responses.OK)
      return
    }

    if (value === this.responses.CANCEL) {
      this.ref.close(this.responses.CANCEL)
      return
    }

    this.loading = true
  }
}
