import { NOMBRE_CARGO_DENUNCIA } from './../../../../shared/helpers/slugs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

//primeng
import { MessagesModule } from 'primeng/messages';
import { ButtonModule } from 'primeng/button';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { TokenService } from '@shared/services/auth/token.service';
import { Router } from '@angular/router';
import { LOCALSTORAGE, VIEW_GENERATED_COMPLAINT_MINUTES, } from '@environments/environment';
import { ProgressBarModule } from 'primeng/progressbar';
import { Subscription } from 'rxjs';
import { MesaService } from '@shared/services/shared/mesa.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CryptService } from '@shared/services/global/crypt.service';
import { ProfileType } from '@shared/helpers/dataType';
import { SLUG_PROFILE } from '@shared/helpers/slugs';
import { ValidateIdentity } from '@shared/interfaces/verification/validate-identity';
import { ProfileRegistration } from '@shared/interfaces/personal-data/profile-registration';
import { AlertComponent } from '@shared/components/alert/alert.component';
import {ScenePlaceModalComponent} from "@modules/complaint/components/scene-place/modal/scene-place-modal.component";
import {DialogService} from "primeng/dynamicdialog";
import { ClientInfoUtil } from '@shared/utils/client-info';

const { VALIDATE_KEY, DENUNCIA_KEY, PRECARGO_KEY, NOMBRE_DOCUMENTO_KEY } =
  LOCALSTORAGE;

@Component({
  selector: 'complaint-denuncia-registrada',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ProgressBarModule,
    MessagesModule,
    NgxExtendedPdfViewerModule,
    ToastModule,
    AlertComponent,
  ],
  templateUrl: './denuncia-registrada.component.html',
  styles: [
    `
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
    `,
  ],
  providers: [MessageService, DatePipe],
})
export class DenunciaRegistradaComponent implements OnInit, OnDestroy {
  /***************/
  /*  VARIABLES  */
  /***************/

  public data: string = '';
  public previewData: string = '';
  public dataPerfil: string = '';

  public complaintId: string;

  public email: string = 'ejemplo@gmail.com';
  public urlPdf: string = '';
  public procesing: boolean = true;
  public loading: boolean = true;
  public progress: number = 0;
  public suscriptions: Subscription[] = [];
  public suscriptionsUpdate: Subscription;
  public intervalCargo: any;
  public updatingStatus: boolean = false;
  public newComplaint: boolean = false;
  public countdownInterval;
  public remainingTime: number = 0;
  public documentName: string = '';
  public tmpProfile: ProfileType = SLUG_PROFILE.CITIZEN;
  public policeUnit: string = '';
  public judicialUnit: string = '';
  public save = {
    id: '',
    idDenuncia: '',
  };
  public validateIdentity: ValidateIdentity = null;
  public registerProfile: ProfileRegistration = null;
  public countReintentos: number = 0;

  public messages = [
    {
      severity: 'success',
      detail:
        'La denuncia ha sido registrada satisfactoriamente y se le asignó el siguiente número de caso: ',
      detail1: '',
    },
  ];

  /*****************/
  /*  CONSTRUCTOR  */
  /*****************/

  constructor(
    private readonly router: Router,
    private readonly tokenService: TokenService,
    private readonly mesaService: MesaService,
    private readonly messageService: MessageService,
    private readonly cryptService: CryptService,
    private readonly dialogService: DialogService
  ) { }

  /****************/
  /*  LIFE CYCLE  */
  /****************/

  ngOnInit(): void {
    // On start
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Validate item
    !localStorage.getItem(LOCALSTORAGE.VALIDATE_KEY) &&
      this.router.navigate(['/']);

    // Get complaint id
    this.complaintId = this.tokenService.getItemValidateToken('complaintId');

    // Get user email
    const email = this.tokenService.getItemValidateToken('email');
    email && (this.email = email);

    // Obtener el perfil seleccionado actual
    const profile = this.tokenService.getItemValidateToken('typeProfile');
    if (profile !== '') this.tmpProfile = profile as ProfileType;

    // Obtener la dependencia policial
    if (this.tmpProfile === SLUG_PROFILE.PNP) {
      const policeUnit = this.tokenService.getItemValidateToken('policeUnit');
      policeUnit && (this.policeUnit = policeUnit);
    }

    // Obtener la dependencia judicial
    if (this.tmpProfile === SLUG_PROFILE.PJ) {
      const judicialUnit =
        this.tokenService.getItemValidateToken('judicialUnit');
      judicialUnit && (this.judicialUnit = judicialUnit);
    }

    // Obtener el request de validation
    const validationRequest =
      this.tokenService.getItemValidateToken('validateIdentity');
    validationRequest && (this.validateIdentity = validationRequest);

    // Obtener el request de register profile
    const profileRequest =
      this.tokenService.getItemValidateToken('registerProfile');
    profileRequest && (this.registerProfile = profileRequest);

    // Validate if exist complaint information
    this.validateInfo();
  }

  ngOnDestroy(): void {
    this.suscriptionsUpdate && this.suscriptionsUpdate.unsubscribe();
    this.suscriptions.forEach((s) => s.unsubscribe());
    this.countdownInterval && clearInterval(this.countdownInterval);
    this.intervalCargo && clearTimeout(this.intervalCargo);
  }

  /*******************/
  /*  VALIDATE INFO  */
  /*******************/

  public validateInfo(): void {
    if (localStorage.getItem(DENUNCIA_KEY) && localStorage.getItem(PRECARGO_KEY)) {

      let dataDenuncia = JSON.parse(this.cryptService.decrypt(localStorage.getItem(DENUNCIA_KEY)))

      if (dataDenuncia.denunciaPreviaRegistrada === 1) { //Cuando se genera una denuncia y por a o b se actualiza sobre la misma página se valida que este flag esté en 1
        this.redirectNuevaDenuncia()
        return
      } else {
        delete dataDenuncia.denunciaPreviaRegistrada
        localStorage.setItem(DENUNCIA_KEY, this.cryptService.encrypt(JSON.stringify(dataDenuncia)))

        this.data = localStorage.getItem(DENUNCIA_KEY);

        this.previewData = localStorage.getItem(PRECARGO_KEY);
        this.documentName =
          localStorage.getItem(NOMBRE_DOCUMENTO_KEY) ||
          'CARGO DE INGRESO DE DENUNCIA';
        this.dataPerfil = localStorage.getItem(LOCALSTORAGE.VALIDATE_KEY);
        this.generateComplaint();
      }

      return;
    }

    this.router.navigate(['/realizar-denuncia/datos-denuncia']);
  }

  /************************/
  /*  GENERATE COMPLAINT  */
  /************************/

  public generateComplaint(): void {
    const request = {
      dataPreliminar: this.data,
      dataCargo: this.previewData,
      dataPerfil: this.dataPerfil,
      clientInfo: ClientInfoUtil.getClientInfo()
    };

    const handleError = () => {
      this.showErrorModal(this.countReintentos >= 2 ? 2 : 1);
      this.countReintentos++;
    };

    this.suscriptions.push(
      /***en reemplazo de registrarDenunciaEFE***/
      this.mesaService.registrarDenunciaLegacy(request).subscribe({
        next: (resp) => {
          if (resp.codigo === 200) {
            this.messages[0].detail1 = resp.id;
            this.getUrl(resp.data);

            const dataDenuncia = JSON.parse(this.cryptService.decrypt(this.data));
            dataDenuncia.denunciaPreviaRegistrada = 1;

            const encryptedData = this.cryptService.encrypt(JSON.stringify(dataDenuncia));
            localStorage.setItem(DENUNCIA_KEY, encryptedData);
          } else {
            handleError();
          }
        },
        error: () => handleError(),
      })
    );
  }

  showErrorModal(errorType: number) {
    const ref = this.dialogService.open(ScenePlaceModalComponent, {
      showHeader: false,
      contentStyle: { 'max-width': '670px', padding: '0px' },
      data: {
        errorType: errorType
      }
    });

    ref?.onClose.subscribe((retry: boolean) => {
      if (retry) {
        this.generateComplaint();
      }
    });
  }

  /************/
  /*  OTHERS  */
  /************/
  public redirect(toHome: boolean = false) {
    localStorage.clear();
    if (toHome) {
      this.countdownInterval && clearInterval(this.countdownInterval);
      this.router.navigate(['/']);
    }
  }


  public redirectNuevaDenuncia(): void {
    localStorage.removeItem(LOCALSTORAGE.REFRESH_KEY);
    localStorage.removeItem(LOCALSTORAGE.PERSONA_KEY);
    localStorage.removeItem(LOCALSTORAGE.DENUNCIA_KEY);
    localStorage.removeItem(LOCALSTORAGE.PRECARGO_KEY);
    localStorage.removeItem(LOCALSTORAGE.NOMBRE_DOCUMENTO_KEY);
    this.router.navigate(['realizar-denuncia/datos-denuncia']);

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
      this.progress = 100;
      this.procesing = false;
      clearTimeout(this.intervalCargo);

      setTimeout(() => {
        this.loading = false;
        this.urlPdf = URL.createObjectURL(file);
        this.startCountDown();
      }, 600);
    }
  }

  public openPdf(): void {
    let nombreCargodenuncia: string = NOMBRE_CARGO_DENUNCIA.NOMBRE + NOMBRE_CARGO_DENUNCIA.ESPACIO + this.messages[0].detail1 + NOMBRE_CARGO_DENUNCIA.EXTENSION;
    const link = document.createElement('a');
    link.href = this.urlPdf;
    link.download = nombreCargodenuncia;
    link.target = '_blank';
    link.click();
  }

  /***************/
  /*  COUNTDOWN  */
  /***************/

  private startCountDown() {
    // Get remaining time
    const expirationDate = new Date();
    expirationDate.setMinutes(
      expirationDate.getMinutes() + VIEW_GENERATED_COMPLAINT_MINUTES
    );
    this.calculateDifferencia(expirationDate);
    // Start countdown
    this.countdownInterval = setInterval(() => {
      this.calculateDifferencia(expirationDate);
      if (this.remainingTime <= 0) {
        this.remainingTime = 0;
        this.redirect(true);
      }
    }, 1000);
  }

  private calculateDifferencia(expirationDate: Date) {
    const currentTime = new Date().getTime();
    let difference = expirationDate.getTime() - currentTime;
    this.remainingTime = difference;
  }

}
