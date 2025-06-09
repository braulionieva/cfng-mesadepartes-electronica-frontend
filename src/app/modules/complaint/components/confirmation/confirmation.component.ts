import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
//primeng
import { MessagesModule } from 'primeng/messages';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogModule, DynamicDialogRef, } from 'primeng/dynamicdialog';
//pdf viewer
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { Denuncia, Entidad, EntidadInvolucrada, Involucrado, Lqrr, Persona } from '@shared/interfaces/complaint/complaint-registration';
import { MesaService } from '@shared/services/shared/mesa.service';
import { ProgressBarModule } from 'primeng/progressbar';
import { TokenService } from '@shared/services/auth/token.service';
import { LOCALSTORAGE, SOURCES } from '@environments/environment';
import { CryptService } from '@shared/services/global/crypt.service';
import { SLUG_CONFIRM_RESPONSE, SLUG_ENTITY, SLUG_PROFILE } from '@shared/helpers/slugs';
import { ProfileType } from '@shared/helpers/dataType';
import prosecutors from '../scene-details/helpers/prosecutors';
import { HelperService } from '@shared/services/shared/helper.service';
import { TracingService } from '@modules/tracing/tracing.service';

import { formatDate, getValidString } from '@shared/utils/utils';
import { AppendService } from '@modules/append/append.service';
import { AlertComponent } from '@shared/components/alert/alert.component';

import { iArrowLeft } from 'ngx-mpfn-dev-icojs-regular';
import { FnIcon } from '@shared/interfaces/fn-icon';
import { CmpLibModule } from 'ngx-mpfn-dev-cmp-lib';
import { ConfirmationModalComponent } from './modal/confirmation-modal/confirmation-modal.component';
import { CancelModalComponent } from '@shared/components/verification/modal/cancel-modal/cancel-modal.component';

interface AttachedsCount {
  annexesCount: number;
  foliosCount: number;
}

const { DENUNCIA_KEY, PRECARGO_KEY, NOMBRE_DOCUMENTO_KEY, VALIDATE_KEY } =
  LOCALSTORAGE;

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [
    CommonModule, MessagesModule, ButtonModule, ProgressBarModule, PdfViewerModule,
    DynamicDialogModule, AlertComponent, CmpLibModule
  ],
  templateUrl: './confirmation.component.html',
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
    `,
  ],
  providers: [DialogService],
})
export class ConfirmationComponent implements OnInit {
  /***************/
  /*  VARIABLES  */
  /***************/
  public completeName: string = '';

  public urlPdf: string = '';
  public data: Denuncia = null;

  public messages = [
    {
      severity: 'warn',
      detail: this.warnMessage,
    },
  ];

  public refModal: DynamicDialogRef;
  validaToken;

  public loading: boolean = true;

  public complaintId: string;
  public tmpProfile: ProfileType = SLUG_PROFILE.CITIZEN;

  public policeUnit: string = '';
  public judicialUnit: string = '';

  public crime: string = '';
  public prosecutors = prosecutors;

  public previewData: any = null;

  public documentName: string = '';

  public isWithAbogado: boolean = false;

  public iArrowLeft: FnIcon = iArrowLeft as FnIcon;

  /*****************/
  /*  CONSTRUCTOR  */

  /*****************/

  constructor(
    private readonly router: Router,
    private readonly mesaService: MesaService,
    private readonly dialogService: DialogService,
    private readonly tokenService: TokenService,
    private readonly cryptService: CryptService,
    private readonly helperService: HelperService,
    private readonly trackingService: TracingService,
    private readonly appendService: AppendService
  ) { }

  /****************/
  /*  LIFE CYCLE  */

  /****************/
  ngOnInit(): void {
    // On start
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let valida = localStorage.getItem(LOCALSTORAGE.VALIDATE_KEY);
    this.validaToken = JSON.parse(this.cryptService.decrypt(valida));

    this.completeName = `${this.validaToken.personaNatural.nombres} ${this.validaToken.personaNatural.apellidoPaterno} ${this.validaToken.personaNatural.apellidoMaterno}`;
    this.documentName = '';

    // Obtener el perfil seleccionado actual
    const profile = this.tokenService.getItemValidateToken('typeProfile');
    if (profile !== '') this.tmpProfile = profile as ProfileType;

    // Obtener la dependencia policial
    if (this.tmpProfile === SLUG_PROFILE.PNP) {
      const dependencia =
        this.validaToken.registerProfile.descDependenciaPolicial;
      dependencia && (this.policeUnit = dependencia);
    }

    // Obtener la dependencia judicial
    if (this.tmpProfile === SLUG_PROFILE.PJ) {
      const dependencia =
        this.validaToken.registerProfile.descDependenciaJudicial;
      dependencia && (this.judicialUnit = dependencia);
    }

    // Obtener si fue ingresada por abogado
    const isWithAbogado =
      this.tokenService.getItemValidateToken('isWithAbogado');
    isWithAbogado && (this.isWithAbogado = isWithAbogado);

    if (this.router.url.includes('realizar-denuncia')) {
      // Get complaint id
      this.complaintId = this.tokenService.getItemValidateToken('complaintId');
      // Validate if exist complaint information
      this.validate();
    } else {
      //flujod e seguimeinto
      this.getPreviewConsult();
    }
  }

  /*****************/
  /*  GET METHODS  */

  /*****************/

  get isComplaintProcess(): boolean {
    return this.router.url.includes('realizar-denuncia');
  }

  get title(): string {
    return this.isComplaintProcess
      ? 'Confirmación de registro denuncia'
      : 'Confirmación de registro';
  }

  get subtitle(): string {
    return this.isComplaintProcess
      ? 'Por favor revise los datos de la denuncia antes de registrarlo.'
      : 'Por favor revise los datos de los documentos antes de registrarlo.';
  }

  get warnMessage(): string {
    return this.isComplaintProcess
      ? 'Cuando registre la denuncia se le asignará un número de caso, una fiscalía y despacho que gestionará su denuncia.'
      : 'Cuando se genere el documento se le asignará un número de documento.';
  }

  get buttonTxt(): { confirm: string; cancel: string } {
    return this.isComplaintProcess
      ? { confirm: 'Registrar denuncia', cancel: 'Regresar' }
      : { confirm: 'Registrar documentos', cancel: 'Editar documentos' };
  }

  /**************************/
  /*  VALIDATE INFORMATION  */

  /**************************/

  public async validate(): Promise<void> {
    if (localStorage.getItem(DENUNCIA_KEY)) {
      this.data = JSON.parse(
        this.cryptService.decrypt(localStorage.getItem(DENUNCIA_KEY))
      );
      localStorage.removeItem(DENUNCIA_KEY);
      this.getPreview();
      return;
    }
    this.router.navigate(['/realizar-denuncia/datos-denuncia']);
  }

  /*****************/
  /*  GET PREVIEW  */
  /*****************/

  /*  RZAVALETA POR FALTA DE MAESTROS */

  public prepararDataAnexos() {
    let amountMedidaProteccion = 0;
    let amountRepresentanteLegal = 0;

    amountMedidaProteccion = this.data.medidaProteccion
      ? this.data.medidaProteccion.anexosAsociados.anexos[0].tamanyo
      : 0;

    if (amountMedidaProteccion > 0) {
      for (
        let i = 0;
        i < this.data.medidaProteccion.anexosAsociados.anexos.length;
        i++
      ) {
        delete this.data.medidaProteccion.anexosAsociados.anexos[i].file;
      }
    }

    amountRepresentanteLegal = this.data.entidad ? this.data.entidad.archivoPerfil.anexos[0].tamanyo : 0;

    if (amountRepresentanteLegal > 0) {
      for (let i = 0; i < this.data.entidad.archivoPerfil.anexos.length; i++) {
        delete this.data.entidad.archivoPerfil.anexos[i].file;
      }
    }

    let anexo = this.data.anexosAsociados.anexos ? true : false;

    if (anexo) {
      for (let i = 0; i < this.data.anexosAsociados.anexos.length; i++) {
        delete this.data.anexosAsociados.anexos[i].file;
      }
    }
  }

  public getPreview(): void {
    const params = this.buildPreviewParams();
    this.previewData = { parametros: params };

    // Guardar estado y llamar al servicio
    localStorage.setItem(
      DENUNCIA_KEY,
      this.cryptService.encrypt(JSON.stringify(this.data))
    );
    this.trackingService.getPreliminarCargo(params, this.data.idPerfil).subscribe({
      next: res => this.getUrl(String(res)),
      error: err => this.getUrl(String(err.error.text))
    });
  }

  private buildPreviewParams(): any {
    this.stripAnexosFiles();
    const count = this.getAttachedsCount();
    const base = {
      fechaIngreso: '',
      motivoIngreso: this.getProfileType(this.tmpProfile),
      especialidad: 'COMÚN',
      cuaderno: 'PRINCIPAL',
      remitenteDenuncia: this.completeName,
      anexo: count.annexesCount,
      numeroFolios: count.foliosCount,
      observaciones: this.data.anexosAsociados?.observacion || '-',
      fechaHecho: this.formatFechaHecho(),
      delito: this.data.delito.delito,
      hecho: this.data.delito.hecho,
      denunciantes: this.getPartesInvolucradas(this.data.partesDenunciantes),
      agraviados: this.getPartesInvolucradas(this.data.partesAgraviadas),
      denunciados: this.getPartesInvolucradas(this.data.partesDenunciadas),
      esAbogado: this.isWithAbogado,
      contacto: this.completeName
    };
    this.data.idPerfil = SLUG_PROFILE.CITIZEN;
    this.applyProfileCustomizations(base);
    return base;
  }

  private stripAnexosFiles(): void {
    // Elimina la prop `file` de todos los anexos
    const arrays = [
      this.data.anexosAsociados?.anexos,
      this.data.medidaProteccion?.anexosAsociados?.anexos,
      this.data.entidad?.archivoPerfil?.anexos
    ];
    arrays.forEach(arr => arr?.forEach(a => delete a.file));
  }

  private formatFechaHecho(): string {
    const { fechaHecho, horaHecho } = this.data.lugarHecho;
    return horaHecho
      ? `${fechaHecho} ${horaHecho} hrs.`
      : fechaHecho;
  }

  private applyProfileCustomizations(params: any): void {
    switch (this.tmpProfile) {
      case SLUG_PROFILE.PNP: this.applyPNPParams(params); break;
      case SLUG_PROFILE.PJ: this.applyPJParams(params); break;
      case SLUG_PROFILE.ENTITY: this.applyEntityParams(params); break;
    }
  }

  private applyPNPParams(p: any): void {
    this.data.idPerfil = SLUG_PROFILE.PNP;
    p.dependenciaPolicial = this.data.policia.descDependenciaPolicial;
    p.informePolicial = this.data.policia.numeroInformePolicial;
  }

  private applyPJParams(p: any): void {
    this.data.idPerfil = SLUG_PROFILE.PJ;
    p.dependenciaJudicial = this.data.juzgado.descEntidad;
    p.nroExpediente = this.data.nroExpediente;
    if (this.data.medidaProteccion) {
      p.medidaProteccion = 'SI';
      const tipos = [...this.data.medidaProteccion.tiposViolencia].sort();
      p.tipoViolencia = tipos.join(', ');
      p.tipoRiesgo = this.data.medidaProteccion.tipoRiesgo;
    } else {
      p.medidaProteccion = 'NO';
    }
  }

  private applyEntityParams(p: any): void {
    this.data.idPerfil = SLUG_PROFILE.ENTITY;
    p.representanteLegal = [
      this.data.entidad.procurador.nombre,
      this.data.entidad.procurador.apellidoPaterno,
      this.data.entidad.procurador.apellidoMaterno || ''
    ].filter(Boolean).join(' ');
    p.denunciantes = this.data.entidad.razonSocial;
  }

  payloadBodyTracking() {
    let body = {};
    let jasper =
      'http://172.16.111.112:8081/repositorio/resources/publico/carpeta/plantilla/jasperActualizado/tipo_sujeto_ciudadano.jasper';
    const currentCase = this.appendService.currentCase;

    body['logo'] = SOURCES.LOGO;
    body['marcaAgua'] = SOURCES.WATERMARK;
    body['nroDocumento'] = 'POR ASIGNAR';
    body['nroCaso'] = currentCase['codigoCaso'];
    body['distritoFiscal'] = currentCase['distritoFiscal'];
    body['especialidad'] = currentCase['especialidad'];
    body['fiscalia'] = currentCase['fiscalia'];
    body['despacho'] = currentCase['despacho'];
    body['fechaIngreso'] = this.formatDate(currentCase['fechaDenuncia']);
    body['tipoDocumento'] =
      this.appendService.selectedAttachmentForm.documentType.nombre;
    body['remitenteDoc'] = this.completeName;
    body['tipoPersona'] = currentCase['tipoPersona'];
    body['anexo'] = 1;
    body['numeroFolios'] = this.appendService.currentAttchmentForm.txtNumeroPag;
    body['sumilla'] =
      this.appendService.currentAttchmentForm.attachedInformation;
    body['observaciones'] = this.appendService.currentAttchmentForm.observation;
    body['esAbogado'] = this.isWithAbogado;
    body['idPerfil'] = this.tmpProfile;

    if (this.tmpProfile === SLUG_PROFILE.PNP) {
      body['idPerfil'] = this.tmpProfile;
      body['dependenciaPolicial'] = this.policeUnit;
      jasper =
        'http://172.16.111.112:8081/repositorio/resources/publico/carpeta/plantilla/jasperActualizado/tipo_sujeto_policia_nacional.jasper';
    }
    // PJ
    if (this.tmpProfile === SLUG_PROFILE.PJ) {
      body['idPerfil'] = this.tmpProfile;
      body['dependenciaJudicial'] = this.judicialUnit;
      body['medidasProteccion'] = '';
      jasper =
        'http://172.16.111.112:8081/repositorio/resources/publico/carpeta/plantilla/jasperActualizado/tipo_sujeto_poder_judicial.jasper';
    }
    // ENTITY
    if (this.tmpProfile === SLUG_PROFILE.ENTITY) {
      body['idPerfil'] = this.tmpProfile;
      body['entidad'] = this.getEntityName(this.data.entidad);
      body['representante'] = this.completeName;
      body['firmante'] = '-';
      jasper =
        'http://172.16.111.112:8081/repositorio/resources/publico/carpeta/plantilla/jasperActualizado/tipo_sujeto_entidad.jasper';
    }

    if (this.isWithAbogado) {
      body['abogado'] = body['denunciantes'];
    }

    return {
      data: [body],
      jasper,
    };
  }

  //get precargo para docs adjuntos en seguimiento
  getPreviewConsult() {
    this.trackingService.getVisorPdf(this.payloadBodyTracking()).subscribe({
      next: (res) => {
        this.getUrl(String(res));
      },
      error: (error) => {
        this.getUrl(String(error.error.text));
      },
    });
  }

  /*************************/
  /*  GET ATTACHEDS COUNT  */

  /*************************/
  public getAttachedsCount(): AttachedsCount {
    let annexesCount: number = 0;
    let foliosCount: number = 0;

    // Count Protective Measure Attached
    if (
      this.data?.medidaProteccion &&
      this.data.medidaProteccion?.anexosAsociados?.anexos
    ) {
      this.data.medidaProteccion.anexosAsociados.anexos.forEach((a) => {
        annexesCount += 1;
        foliosCount = foliosCount + a.numeroFolios;
      });
    }

    // Count Entity Attacheds
    if (this.data?.entidad && this.data.entidad?.archivoPerfil?.anexos) {
      this.data.entidad.archivoPerfil.anexos.forEach((a) => {
        foliosCount = foliosCount + a.numeroFolios;
      });
    }

    if (this.data?.archivoPerfil && this.data.archivoPerfil?.anexos) {
      this.data.archivoPerfil.anexos.forEach((a) => {
        foliosCount = foliosCount + a.numeroFolios;
      });
    }

    // Count Annexes
    if (this.data?.anexosAsociados && this.data.anexosAsociados.anexos) {
      this.data.anexosAsociados.anexos.forEach((a) => {
        annexesCount += 1;
        foliosCount = foliosCount + a.numeroFolios;
      });
    }

    return {
      annexesCount,
      foliosCount,
    } as AttachedsCount;
  }

  public getPartesInvolucradas(lista: Involucrado): string {
    const personas = lista.persona ?? [];
    const entidades = lista.entidad ?? [];
    const lqrrs = lista.lqrr ? [lista.lqrr] : [];
    const total = personas.length + entidades.length + lqrrs.length;

    return [
      this.formatPersonas(personas, total),
      this.formatEntidades(entidades, personas.length, total),
      this.formatLqrrs(lqrrs, personas.length + entidades.length, total)
    ]
      .filter(block => !!block)
      .join('\n');
  }

  private formatPersonas(personas: Persona[], total: number): string {
    return personas
      .map((p, i) => {
        const nombre = (p.esMayorEdad === false)
          ? [p.nombres, p.apellidoPaterno, p.apellidoMaterno]
            .map(n => this.enmascararTexto(n))
            .join(' ')
          : `${p.nombres} ${p.apellidoPaterno} ${p.apellidoMaterno || ''}`;
        return `${this.prefix(i, total)}${nombre}`;
      })
      .join('\n');
  }

  private formatEntidades(entidades: EntidadInvolucrada[], offset: number, total: number): string {
    return entidades
      .map((e, i) => `${this.prefix(offset + i, total)}${e.razonSocial}`)
      .join('\n');
  }

  private formatLqrrs(lqrrs: Lqrr[], offset: number, total: number): string {
    return lqrrs
      .map((l, i) => `${this.prefix(offset + i, total)}LOS QUE RESULTEN RESPONSABLES`)
      .join('\n');
  }

  enmascararTexto(texto?: string): string {
    if (!texto || typeof texto !== 'string') return '***';

    const limpio = texto.trim();
    if (!limpio) return '***';

    const visibles = limpio.slice(0, 2);
    const totalLength = Math.max(5, visibles.length);
    const ocultos = '*'.repeat(totalLength - visibles.length);

    return visibles + ocultos;
  }

  /** Si hay más de uno, devuelve "01 ", "02 ", …, sino cadena vacía */
  private prefix(index: number, total: number): string {
    return total > 1
      ? `${(index + 1).toString().padStart(2, '0')} `
      : '';
  }

  /*********************/
  /*  GET ENTITY NAME  */

  /*********************/

  public getEntityName(entity: Entidad): string {
    let name: string = '';
    switch (entity.idTipoEntidad) {
      case SLUG_ENTITY.JURIDICA:
        name = `${entity.razonSocial}`;
        break;

      default:
        name = `${entity.nombreEntidad}`;
        break;
    }
    return name;
  }

  /******************/
  /*  PROFILE TYPE  */

  /******************/

  public getProfileType(profile: ProfileType): string {
    let type: string = '';
    switch (profile) {
      case SLUG_PROFILE.CITIZEN:
        type = 'MPE - DENUNCIA DE PARTE';
        break;
      case SLUG_PROFILE.PNP:
        type = 'MPE - POLICÍA NACIONAL DEL PERÚ';
        break;
      case SLUG_PROFILE.PJ:
        type = 'MPE - PODER JUDICIAL';
        break;
      default:
        type = 'MPE - ENTIDAD';
        break;
    }
    return type;
  }

  /*****************************************/
  /*  CONFIRM OR GO BACK TO PREVIOUS STEP  */

  /*****************************************/

  public previousStep(): void {
    if (this.isComplaintProcess)
      this.router.navigate(['realizar-denuncia/datos-denuncia']);
    else this.router.navigate(['seguir-denuncia/consultar-caso']);
  }

  public nextStep(): void {
    /* denuncia duplicada*/
    let flgDenunciaDuplicada: string;
    let nroCargoDenunciaDuplicada: string;

    console.log('data Duplicidad', this.data);
    this.data.fechaPolicial = null; // Se quito la fecha del formulario, se deja en caso se requiera volver a activar
    const requestDataDenuncia = {
      dataPreliminar: this.cryptService.encrypt(JSON.stringify(this.data)),
    };

    this.mesaService
      .identificarDenunciaDuplicada(requestDataDenuncia)
      .subscribe({
        next: (resp) => {
          if (resp) {
            flgDenunciaDuplicada = resp.codigo;
            nroCargoDenunciaDuplicada = resp.id;
            if (flgDenunciaDuplicada == '0') {
              this.confirmGeneration(0);
            } else if (flgDenunciaDuplicada == '1') {
              this.confirmarDenuciaDuplicada(
                flgDenunciaDuplicada,
                nroCargoDenunciaDuplicada
              );
            }
          }
        },
        error: (error) => {
          console.error('ERROR');
        },
      });
  }

  /*************/
  /*  CONFIRM  */

  /*************/

  public confirmarDenuciaDuplicada(
    flgDenunciaDuplicada: string,
    nroCargoDenunciaDuplicada: string
  ): void {
    this.refModal = this.dialogService.open(ConfirmationModalComponent, {
      showHeader: false,
      contentStyle: { 'max-width': '670px', padding: '0px' },
      data: {
        name: this.completeName,
        duplicada: flgDenunciaDuplicada,
        caso: nroCargoDenunciaDuplicada,
      },
    });

    this.refModal.onClose.subscribe((option) => {
      if (option === SLUG_CONFIRM_RESPONSE.OK) {
        if (this.isComplaintProcess) this.generateComplaint(1);
        else this.router.navigate(['seguir-denuncia/documentos-registrados']);
      }
    });
  }

  public confirmGeneration(flgDuplicada: number): void {
    this.refModal = this.dialogService.open(ConfirmationModalComponent, {
      showHeader: false,
      contentStyle: { 'max-width': '670px', padding: '0px' },
      data: { name: this.completeName },
    });

    this.refModal.onClose.subscribe((option) => {
      if (option === SLUG_CONFIRM_RESPONSE.OK) {
        if (this.isComplaintProcess) this.generateComplaint(flgDuplicada);
        else this.router.navigate(['seguir-denuncia/documentos-registrados']);
      }
    });
  }

  /**********************/
  /*  CANCEL COMPLAINT  */
  /**********************/

  public askToCancelComplaint(): void {
    // Ask user to confirm if wants to cancel complaint
    this.refModal = this.dialogService.open(CancelModalComponent, {
      showHeader: false,
      contentStyle: { 'max-width': '670px', 'padding': '0px' },
      data: { name: this.completeName },
    });
  }

  /************************/
  /*  GENERATE COMPLAINT  */

  /************************/

  public generateComplaint(flgDenunciaDuplicada: number) {
    const document = `CARGO DE INGRESO DE DENUNCIA${getValidString(this.documentName) !== null
      ? ' - ' + getValidString(this.documentName)
      : ''
      }`;
    localStorage.setItem(NOMBRE_DOCUMENTO_KEY, document);

    this.data.duplicada = flgDenunciaDuplicada
    this.data.denunciaPreviaRegistrada = 0 //0 false, 1 true

    localStorage.setItem(
      DENUNCIA_KEY,
      this.cryptService.encrypt(JSON.stringify(this.data))
    );
    localStorage.setItem(
      PRECARGO_KEY,
      this.cryptService.encrypt(JSON.stringify(this.previewData))
    );

    localStorage.setItem(
      VALIDATE_KEY,
      this.cryptService.encrypt(JSON.stringify(this.validaToken))
    );

    this.helperService.setwantsToStartCountDown(false);
    this.router.navigate(['/realizar-denuncia/denuncia-registrada']);
  }

  /************/
  /*  OTHERS  */

  /************/

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
      this.loading = false;
      this.urlPdf = URL.createObjectURL(file);
    }
  }

  public getCurrentDate(): string {
    const fechaHora = new Date();
    const opcionesFecha = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    };
    const opcionesHora = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };
    return `${fechaHora.toLocaleString(
      'es-ES',
      opcionesFecha as Intl.DateTimeFormatOptions
    )} ${fechaHora.toLocaleString(
      'es-ES',
      opcionesHora as Intl.DateTimeFormatOptions
    )}`;
  }

  public formatDate(date: string): string {
    if (!date) return '-';
    return formatDate(new Date(date));
  }
}
