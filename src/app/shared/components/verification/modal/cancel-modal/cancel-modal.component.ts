import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { CommonModule } from '@angular/common';

//primeng
import { ButtonModule } from "primeng/button";

//mpfn
import { CmpLibModule } from "ngx-mpfn-dev-cmp-lib";
import { obtenerIcono } from '@shared/utils/icon';

import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-cancel-modal',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CmpLibModule
  ],
  templateUrl: './cancel-modal.component.html',
})
export class CancelModalComponent {
  public obtenerIcono = obtenerIcono

  constructor(
    public readonly ref: DynamicDialogRef,
    public readonly config: DynamicDialogConfig,
    private readonly router: Router
  ) { }

  confirmExitVerification(): void {
    this.ref !== null && this.ref.close()

    this.router.navigate(['/'])
  }

  get isComplaintProcess(): string {
    let tituloCabeceraModal = ""

    if (this.router.url.includes('realizar-denuncia')) {
      tituloCabeceraModal = "de la presentación de la denuncia"
    }

    if (this.router.url.includes('presentar-documento')) {
      tituloCabeceraModal = "de la presentación de documento"
    }

    if (this.router.url.includes('seguir-denuncia')) {
      tituloCabeceraModal = "del seguimiento del caso"
    }

    return tituloCabeceraModal
  }
}
