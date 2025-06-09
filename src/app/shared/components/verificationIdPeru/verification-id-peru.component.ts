import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from "@angular/router";
import { MessagesModule } from "primeng/messages";
import { ButtonModule } from "primeng/button";
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { CmpLibModule, ctrlErrorMsg, onlyNumbers } from "ngx-mpfn-dev-cmp-lib";
import { VerificationService } from '@shared/services/complaint-registration/verification.service';
import { Subscription } from 'rxjs';
import { CryptService } from '@shared/services/global/crypt.service';
import { MessageService } from 'primeng/api';
import { IpService } from '@shared/services/global/ip.service';
import { HelperService } from '@shared/services/shared/helper.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { StorageService } from '@shared/services/storage.service';
import { ValidarInputDirective } from '@core/directives/validar-input.directive';
import { DomSanitizer } from '@angular/platform-browser';
import { PreFooterComponent } from "@shared/components/pre-footer/pre-footer.component";
import { CancelModalComponent } from "@shared/components/verification/modal/cancel-modal/cancel-modal.component";

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [CommonModule, MessagesModule, FormsModule,
    ReactiveFormsModule, ButtonModule, ToastModule, DialogModule,
    CmpLibModule, ValidarInputDirective, TooltipModule, PreFooterComponent
  ],
  templateUrl: './verification-id-peru.component.html',
  styleUrls: ['./verification-id-peru.component.scss'],
  providers: [MessageService, DialogService],
})
export class VerificationIdPeruComponent implements OnInit, OnDestroy {
  ERRORDNI = false;
  errorMessage = '';
  public refModal: DynamicDialogRef;
  public isLoading = false;

  constructor(
    private readonly router: Router,
    private readonly ipService: IpService,
    private readonly verificationService: VerificationService,
    private readonly cryptService: CryptService,
    private readonly messageService: MessageService,
    private readonly storageService: StorageService,
    private readonly helperService: HelperService,
    private readonly dialogService: DialogService,
    private readonly sanitizer: DomSanitizer
  ) { }

  public verificationForm: FormGroup = new FormGroup({
    dni: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(8),
      Validators.pattern(onlyNumbers)
    ]),
    captcha: new FormControl('', [
      Validators.required,
      Validators.minLength(6)
    ])
  });

  public suscriptions: Subscription[] = [];
  private readonly ip: string = '';
  captchaImg: string = '';
  captchaId: string = '';

  ngOnInit(): void {
    this.loadCaptcha();
  }

  ngOnDestroy(): void {
    this.suscriptions.forEach(e => e.unsubscribe());
  }

  protected validMaxLength(field: string = 'dni'): void {
    let value: string = '';
    let maxLength: number = 0;
    let control: any = null;

    if (field == 'dni') {
      maxLength = 8;
      control = this.verificationForm.get(field);
    }

    value = control.value;
    value.length > maxLength && control.setValue(value.slice(0, maxLength));
  }

  get isTrackingProcess(): boolean {
    return this.router.url.includes('seguir-denuncia/verificacion');
  }

  get isTrackingDocument(): boolean {
    return this.router.url.includes('presentar-documento/verificacion');
  }

  get cancelLabel(): string {
    return `Cancelar`;
  }

  errorMsg(ctrlName) {
    return ctrlErrorMsg(this.verificationForm.get(ctrlName));
  }

  validateIdentity() {
    if (this.verificationForm.invalid) {
      Object.keys(this.verificationForm.controls).forEach(key => {
        this.markingDirty(this.verificationForm.get(key));
      });
      return;
    }

    this.isLoading = true;
    const dataVerificationForm = this.verificationForm.getRawValue();

    // Primero validamos el captcha
    this.suscriptions.push(
      this.verificationService.validateCaptcha(this.captchaId, dataVerificationForm.captcha).subscribe({
        next: respCatpcha => {
          if (respCatpcha.data) {
            this.suscriptions.push(
              this.verificationService.obtenerUrlReniec().subscribe({
                next: resp => {
                  if (resp && resp.length > 0) {
                    window.location.href = resp;
                  }
                  this.isLoading = false;
                },
                error: (error) => {
                  this.showMessages(error);
                  this.isLoading = false;
                }
              })
            );
          } else {
            this.loadCaptcha();
            this.messageService.add({
              severity: 'error',
              closable: true,
              detail: 'El código captcha ingresado es incorrecto. Por favor, intente nuevamente.'
            });
            this.isLoading = false;
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            closable: true,
            detail: 'El código captcha ingresado es incorrecto. Por favor, intente nuevamente.'
          });
          this.verificationForm.get('captcha').setValue('');
          this.loadCaptcha();
          this.isLoading = false;
        }
      })
    );
  }

  private continueStep() {
    if (this.isTrackingDocument) {
      this.router.navigate(['presentar-documento/consultar-caso']);
    } else if (this.isTrackingProcess) {
      this.router.navigate(['seguir-denuncia/consultar-caso']);
    } else {
      this.helperService.setwantsToStartCountDown(true);
      this.router.navigate(['realizar-denuncia/datos-personales']);
    }
  }

  private showMessages(error: any) {
    this.ERRORDNI = false;
    if (error.error.code == "42202015") {
      this.ERRORDNI = true;
      this.markingDirty(this.verificationForm.get('dni'));
    } else {
      this.messageService.add({ severity: 'error', closable: true, detail: error.error.message || "Error durante el proceso" });
    }
  }

  public askToCancelComplaint(): void {
    this.refModal = this.dialogService.open(CancelModalComponent, {
      showHeader: false,
      contentStyle: { 'max-width': '670px', 'padding': '0px' },
    });
  }

  markingDirty(fieldControl: any): void {
    fieldControl.setErrors({ required: true });
    fieldControl.markAsDirty();
    fieldControl.markAsTouched();
  }

  loadCaptcha() {
    this.verificationService.loadCaptcha().subscribe({
      next: (response) => {
        this.captchaImg = response.data.image;
        this.captchaId = response.data.captchaId;
      },
      error: (error) => {
        console.error('Error al cargar captcha:', error);
        this.captchaImg = '';
        this.captchaId = '';
        this.showMessages(error);
      }
    });
  }

  reloadCaptcha() {
    this.loadCaptcha();
  }
}
