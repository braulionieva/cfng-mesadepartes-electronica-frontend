import { CommonModule } from '@angular/common';

import { Component, OnInit, OnDestroy } from '@angular/core';

/**
 * PrimeNG
 */
//modulos
import { MessagesModule } from "primeng/messages";
import { ButtonModule } from "primeng/button";
//
import { Message } from 'primeng/api'
import { DynamicDialogModule, DialogService, DynamicDialogRef } from "primeng/dynamicdialog";

//mpfn
import { CmpLibModule } from "ngx-mpfn-dev-cmp-lib";
import { obtenerIcono } from '@shared/utils/icon';

//components
import { ConditionsModalComponent } from "./components/conditions-modal/conditions-modal.component";

import { Router } from '@angular/router';
import { AuthService } from '@shared/services/auth/auth.service';
import { PreFooterComponent } from '@shared/components/pre-footer/pre-footer.component';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { VerificationService } from '@shared/services/complaint-registration/verification.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  standalone: true,
  imports: [
    MessagesModule,
    CommonModule,
    ButtonModule,
    CmpLibModule,
    DynamicDialogModule,
    PreFooterComponent,
    AlertComponent
  ],
  providers: [DialogService]
})

export class MainComponent implements OnInit, OnDestroy {

  public obtenerIcono = obtenerIcono

  public refModal: DynamicDialogRef;

  public messages: Message[] = [
    {
      severity: 'error'
    }
  ];

  public loadingTracking: boolean = false;
  public loadingTrackingDocument: boolean = false;

  constructor(
    public readonly dialogService: DialogService,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly verificationService: VerificationService,
  ) { }

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' })

    localStorage.clear();
  }

  /********************
  * Conditions Modal  *
  *********************/
  showConditions(): void {
    this.refModal = this.dialogService.open(ConditionsModalComponent, {
      showHeader: false,
      contentStyle: { 'max-width': '1020px', 'padding': '0px' },
      data: { name: '', isTrackingDocument: this.loadingTrackingDocument }
    })

    this.refModal.onClose.subscribe((involved) => {
      this.loadingTracking = false;
      this.loadingTrackingDocument = false;
    })

  }

  validateIdPeruAndProceed() {
    this.verificationService.validateIdPeruStatus().subscribe({
      next: (response) => {
        if (response.data) {
          this.router.navigate(['/verificacion-id-peru']);
        } else {
          this.showConditions();
        }
      },
      error: (error) => {
        console.error('Error al validar estado de ID Perú:', error);
      }
    });
  }

  public presentarDenuncia(): void {
    localStorage.clear();
    this.loadingTracking = false;
    this.loadingTrackingDocument = false;

    this.validateIdPeruAndProceed();
  }

  public consultarCaso(): void {
    localStorage.clear();
    this.loadingTracking = true;

    this.authService.login().subscribe({
      next: (success) => success && this.router.navigate(['seguir-denuncia']),

      error: (error) => {
        this.loadingTracking = false;
      }
    })
  }

  public presentarDocumento(): void {
    localStorage.clear();
    this.loadingTrackingDocument = true;

    this.validateIdPeruAndProceed();
  }

  ngOnDestroy() {

    if (this.refModal)
      this.refModal.close()
  }

}
