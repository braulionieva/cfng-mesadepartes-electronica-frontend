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
    RippleModule, CommonModule, ButtonModule, DialogModule
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  template: `
  <div class="p-dialog-header w-full bg-secondary-header pt-4 pl-4">
        <div class="flex align-items-center">
            <i class="pi pi-info-circle icon-color"></i>
            <span class="p-dialog-title mpfn-poppins-semi-bold mpe_modal_titulo">Advertencia de verificación de datos</span>
        </div>
    </div>
    <div class="flex flex-wrap my-2" >
      <div class="mb-3 mx-5 justify-content-center mpfn-roboto-regular mpe_modal_descripcion" >{{ errorMessage }}
      </div>
    </div>
    <div class="flex flex-wrap justify-content-center mb-4 mx-3 display-inline-block mpe_modal_opciones">
      <p-button
        class="p-button-aceptar"
        styleClass="p-button-lg bg-secondary font-semibold"
        label="Aceptar"
        [loading]="loading"
        (onClick)="selectOk(responses.OK)"
      />
    </div>
  `,
  styles: [
    `
        .bg-secondary-header{
          color: #d9a927;
          border-bottom: none;
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
export class ErrorVerificationModal implements OnInit {

  @Input() public errorMessage;
  public responses = SLUG_CONFIRM_RESPONSE
  public loading: boolean = false

  constructor(
    public readonly ref: DynamicDialogRef,
    public readonly config: DynamicDialogConfig,
    public readonly helperService: HelperService,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    this.errorMessage = this.config.data.errorMessage;
  }
  public selectOk(value: string): void {

    if (value === this.responses.OK) {
      this.ref.close()
    }
  }

  get isComplaintProcess(): boolean {
    return this.router.url.includes('realizar-denuncia')
  }

}
