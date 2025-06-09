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
            <span class="p-dialog-title">Advertencia de verificación</span>
        </div>
    </div>
    <div class="flex flex-wrap  my-2 mx-2 " >
        <div class="my-5 mx-5" justify-content-center>Error al verificar:
          <ul>
            <li>{{ 'DNI'+messageFieldError}}
            </li><li>{{ ' FN '+messageFieldError}}
            </li><li>{{ ' VER '+messageFieldError}}
            </li>
          </ul>
        </div>
        <br>
    </div>
    <div class="flex flex-wrap justify-content-center my-6 mx-3 display-inline-block">
           <p-button
                styleClass="p-button surface-200 font-semibold text-primary"
                class="p-button-width"
                label="Aceptar"
                [disabled]="loading"
                (onClick)="selectOk(responses.OK)"
            />

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
export class WrongVerificationModal implements OnInit {
  @Input() public messageFieldError;
  public responses = SLUG_CONFIRM_RESPONSE
  public loading: boolean = false

  constructor(
    public readonly ref: DynamicDialogRef,
    public readonly config: DynamicDialogConfig,
    public readonly helperService: HelperService,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    this.messageFieldError = this.config.data.messageFieldError;
  }

  public selectOk(value: string): void {
    if (value === this.responses.OK)
      this.ref.close()
  }

  get isComplaintProcess(): boolean {
    return this.router.url.includes('realizar-denuncia')
  }
}