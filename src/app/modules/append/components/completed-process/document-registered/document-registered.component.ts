import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { TokenService } from "@shared/services/auth/token.service";
import { AuthService } from "@shared/services/auth/auth.service";
import { MessageService } from "primeng/api";
import { HelperService } from "@shared/services/shared/helper.service";
import { CryptService } from "@shared/services/global/crypt.service";
import { VerificationService } from "@shared/services/complaint-registration/verification.service";
import { LOCALSTORAGE, VIEW_GENERATED_COMPLAINT_MINUTES } from "@environments/environment";
import { CommonModule, DatePipe } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { ProgressBarModule } from "primeng/progressbar";
import { MessagesModule } from "primeng/messages";
import { PdfViewerModule } from "ng2-pdf-viewer";
import { ToastModule } from "primeng/toast";
import { AlertComponent } from "@shared/components/alert/alert.component";
import { AppendService } from "@modules/append/append.service";
import { StorageService } from "@shared/services/storage.service";
import { Subscription } from "rxjs";
import { ValidationToken } from "@shared/interfaces/verification/validation-token";
import { ValidateIdentity } from "@shared/interfaces/verification/validate-identity";
import { ProfileRegistration } from "@shared/interfaces/personal-data/profile-registration";

//const {NOMBRE_DOCUMENTO_KEY} = LOCALSTORAGE
const { VALIDATE_KEY, NOMBRE_DOCUMENTO_KEY } = LOCALSTORAGE

@Component({
  standalone: true,
  selector: 'app-document-registered',
  templateUrl: './document-registered.component.html',
  styles: [`
    .visor-background {
      width: 100%;
      background-color: #e8e8e880;
    }

    .visor-pdf {
      width: 100%;
      height: 1135px;
    }

    .fix-separation {
      margin-top: 30px;
    }
  `],
  providers: [MessageService, DatePipe],
  imports: [
    CommonModule,
    ButtonModule,
    ProgressBarModule,
    MessagesModule,
    PdfViewerModule,
    ToastModule,
    AlertComponent
  ],
})
export class DocumentRegisteredComponent implements OnInit {

  public procesing: boolean = true
  public loading: boolean = true
  public remainingTime: number = 0
  public email: string = 'ejemplo@gmail.com'
  public urlPdf: string = ''
  public countdownInterval;
  public newComplaint: boolean = false
  public registrado: boolean = false
  private documentoDatos: any = null;
  public suscriptions: Subscription[] = []
  public validateIdentity: ValidateIdentity = null
  public registerProfile: ProfileRegistration = null
  nombreCargoDocumento: string = ""
  validaToken: any;
  public save = {
    id: '',
    idDenuncia: '',
  };

  public messages = [
    {
      severity: 'success',
      detail: 'El documento se ha registrado satisfactoriamente al número de caso: ' + this.getNumeroCaso(),
      detail1: ""
    }
  ];

  constructor(
    private readonly tokenService: TokenService,
    private readonly authService: AuthService,
    private readonly messageService: MessageService,
    private readonly appendService: AppendService,
    private readonly storageService: StorageService,
    private readonly router: Router,
    private readonly verificationService: VerificationService,
    private readonly helperService: HelperService,
    private readonly cryptService: CryptService,
  ) { }

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const email = this.tokenService.getItemValidateToken('email')
    email && (this.email = email)
    if (this.storageService.existItem(NOMBRE_DOCUMENTO_KEY)) {
      this.documentoDatos = this.storageService.getItem(NOMBRE_DOCUMENTO_KEY);
      this.getNumeroCaso();
      this.removeDataCargo();
      this.registeredAndShowDocument(this.documentoDatos);
      this.documentoDatos = null
    }
    else {
      this.router.navigate(['presentar-documento/datos-documento']);
    }
  }

  removeDataDocument(): void {
    let valida = localStorage.getItem(LOCALSTORAGE.VALIDATE_KEY);
    this.validaToken = JSON.parse(this.cryptService.decrypt(valida));
    let newValidateToken = {
      ...this.validaToken,
      codigoDocumentoEscritoPadre: null,
      files: null,
      numeroFolios: null,
      subsana: null,
      registrado: this.registrado
    };
    this.tokenService.saveItem(VALIDATE_KEY, JSON.stringify(newValidateToken));

    if (this.storageService.existItem(NOMBRE_DOCUMENTO_KEY))
      this.storageService.clearItem(NOMBRE_DOCUMENTO_KEY)

    this.appendService.clearDocumentStorage()
    //localStorage.clear()
  }
  removeDataCargo(): void {
    if (this.storageService.existItem(NOMBRE_DOCUMENTO_KEY))
      this.storageService.clearItem(NOMBRE_DOCUMENTO_KEY)
  }

  public redirect(toHome: boolean = false) {
    this.countdownInterval && clearInterval(this.countdownInterval)
    this.removeDataDocument()
    if (toHome) {
      this.appendService.clearTracingStorage()
      this.newLogin()
      return
    }

    this.router.navigate(['presentar-documento/datos-documento']);
  }

  public redirectError() {
    this.removeDataCargo()
    this.router.navigate(['presentar-documento/datos-documento']);

  }
  public newLogin(): void {
    this.newComplaint = true
    this.suscriptions.push(
      this.authService.login().subscribe({
        next: success => success && this.newVerification(),
        error: () => this.newComplaint = false
      })
    )
  }

  public newVerification(): void {
    const body = this.validateIdentity
    if (body === null) {
      this.newComplaint = false
      this.router.navigate(['/'])
      return
    }

    this.suscriptions.push(
      this.verificationService.validateIdentity(body).subscribe({
        next: resp => {
          if (resp && resp.codigo === 200) {
            let validation: ValidationToken = {
              idPersona: resp.data.idPersona,
              customToken: resp.data.token,
              expirationDate: this.helperService.getExpiredTime()
            }
            localStorage.setItem(LOCALSTORAGE.VALIDATE_KEY, this.cryptService.encrypt(JSON.stringify(validation)))
            this.helperService.setwantsToStartCountDown(true)
          }
        },
        error: () => {
          this.newComplaint = false
          this.router.navigate(['realizar-denuncia'])
        }
      })
    )
  }

  public msgNroCaso = [
    {
      severity: 'success',
      detail: this.getNumeroCaso()
    }
  ];

  public getNumeroCaso(): string {
    if (this.storageService.existItem(NOMBRE_DOCUMENTO_KEY)) {
      this.documentoDatos = this.storageService.getItem(NOMBRE_DOCUMENTO_KEY);
      const jsonDato = JSON.parse(this.documentoDatos);
      return jsonDato.reporte.numeroCaso;
    }
    return '';
  }

  registeredAndShowDocument(dataDocumento: string) {
    let reqDocumento = {
      dataPreliminar: this.cryptService.encrypt(dataDocumento)
    }
    this.appendService.guardarPresentarDocumento(reqDocumento).subscribe({
      next: res => {
        this.nombreCargoDocumento = res.mensaje
        this.getUrl(String(res.data))
        this.registrado = true

        let valida = localStorage.getItem(LOCALSTORAGE.VALIDATE_KEY);
        this.validaToken = JSON.parse(this.cryptService.decrypt(valida));
        let newValidateToken = {
          ...this.validaToken,
          registrado: this.registrado,
        };
        this.tokenService.saveItem(VALIDATE_KEY, JSON.stringify(newValidateToken));
        this.removeDataDocument();
      },
      error: error => {
        this.messageService.add({
          severity: 'error',
          detail: 'Ha ocurrido un error al registrar el documento, intente nuevamente.',
        });
        setTimeout(() => {
          this.registrado = false

          this.router.navigate(['presentar-documento/datos-documento']);
        }, 2000);

      }
    })
  }
  public getUrl(dataB64: string): void {
    const data = dataB64;
    if (data != null) {
      const base64str = data;
      const binary = atob(base64str.replace(/\s/g, ''));

      const len = binary.length;
      const buffer = new ArrayBuffer(len);
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const file = new Blob([bytes], { type: 'application/pdf' });
      this.loading = false
      this.urlPdf = URL.createObjectURL(file);
      this.startCountDown();
    }
  }

  private startCountDown() {
    // Get remaining time
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + VIEW_GENERATED_COMPLAINT_MINUTES);
    this.calculateDifferencia(expirationDate)
    // Start countdown
    this.countdownInterval = setInterval(() => {
      this.calculateDifferencia(expirationDate)
      if (this.remainingTime <= 0) {
        this.remainingTime = 0;
        this.redirect(true)
      }
    }, 1000);
  }

  private calculateDifferencia(expirationDate: Date) {
    const currentTime = new Date().getTime();
    let difference = expirationDate.getTime() - currentTime;
    this.remainingTime = difference;
  }

  public openPdf(): void {
    const link = document.createElement('a');
    link.href = this.urlPdf;
    link.download = this.nombreCargoDocumento;
    link.target = '_blank';
    link.click();
  }
}
