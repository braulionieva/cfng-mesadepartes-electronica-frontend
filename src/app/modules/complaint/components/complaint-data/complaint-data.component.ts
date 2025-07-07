import { Component, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
//primeng
import { AccordionModule } from 'primeng/accordion';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
//components
import { ScenePlaceComponent } from '../scene-place/scene-place.component';
import { SceneDetailsComponent } from '../scene-details/scene-details.component';
import { InvolvedsComponent } from '../involveds/involveds.component';
import { AttachedsComponent } from '../attacheds/attacheds.component';
import { GeneralDataComponent } from '../general-data/general-data.component';
import { EntityDataComponent } from '../entity-data/entity-data.component';
import { EntityInvolvedsComponent } from '../entity-involveds/entity-involveds.component';
//helpers
//slugs
import {
  SLUG_INVOLVED,
  SLUG_MAX_LENGTH,
  SLUG_PROFILE,
} from '@shared/helpers/slugs';
import { ProfileType } from '@shared/helpers/dataType';
import { TokenService } from '@shared/services/auth/token.service';
import { CboItem } from '@shared/interfaces/combos/combos';
import { MaestrosService } from '@shared/services/shared/maestros.service';
import { Subscription } from 'rxjs';
import {
  Denuncia,
  Entidad,
} from '@shared/interfaces/complaint/complaint-registration';
import { DenunciaInit } from 'src/assets/data/DenunciaInit';
import { CryptService } from '@shared/services/global/crypt.service';
import { MesaService } from '@shared/services/shared/mesa.service';

import { CmpLibModule } from 'ngx-mpfn-dev-cmp-lib';

import { LOCALSTORAGE, } from '@environments/environment';
import { Router } from '@angular/router';
import { getValidString, validateDateTime } from '@shared/utils/utils';
import { DialogService, DynamicDialogModule, DynamicDialogRef, } from 'primeng/dynamicdialog';

import { obtenerIcono } from '@shared/utils/icon';
import { CancelModalComponent } from '@shared/components/verification/modal/cancel-modal/cancel-modal.component';

const { DENUNCIA_KEY } = LOCALSTORAGE;

@Component({
  selector: 'app-complaint-data',
  standalone: true,
  imports: [
    AccordionModule, ButtonModule, CommonModule, ScenePlaceComponent, SceneDetailsComponent, InvolvedsComponent,
    AttachedsComponent, GeneralDataComponent, EntityDataComponent, EntityInvolvedsComponent, ToastModule,
    ButtonModule, DynamicDialogModule, CmpLibModule, AccordionModule
  ]
  ,
  templateUrl: './complaint-data.component.html',
  styleUrls: ['./complaint-data.component.scss'],
  providers: [MessageService, DialogService],
})
export class ComplaintDataComponent implements OnInit, OnDestroy {
  /***************/
  /*  VARIABLES  */
  /***************/

  public obtenerIcono = obtenerIcono;

  public SLUG_PROFILE = SLUG_PROFILE;
  public tmpProfile: ProfileType = SLUG_PROFILE.CITIZEN;
  public documentTypes: CboItem[] = [];
  public suscriptions: Subscription[] = [];
  public complaintId: string;

  public data: Denuncia = { ...DenunciaInit };
  public savedData: any = {};
  private readonly timer: any;
  public expanded: boolean = true;
  public completeName: string = '';
  public protectiveMeasure: number = null;
  public refModal: DynamicDialogRef;
  public userData;

  private amountMedidaProteccion: number = 0;
  private amountAnexo: number = 0;
  public sumTotalBytesFiles: number = 0;
  private amountRepresentanteLegal: number = 0;

  public fechaPolicial: Date = null;

  public hasFiles: boolean = false;

  /*****************/
  /*  CONSTRUCTOR  */
  /*****************/

  constructor(
    private readonly router: Router,
    private readonly tokenService: TokenService,
    private readonly maestrosService: MaestrosService,
    private readonly mesaService: MesaService,
    private readonly cryptService: CryptService,
    private readonly messageService: MessageService,
    private readonly dialogService: DialogService,
    private readonly elementRef: ElementRef
  ) { }

  /*******************/
  /*    LIFECYCLE    */
  /*******************/

  ngOnInit(): void {
    // Obtener el perfil seleccionado actual
    const profile = this.tokenService.getItemValidateToken('typeProfile');
    if (profile !== '') this.tmpProfile = profile as ProfileType;

    // Obtener si fue ingresada por abogado
    const protectiveMeasure =
      this.tokenService.getItemValidateToken('protectiveMeasure');
    protectiveMeasure && (this.protectiveMeasure = protectiveMeasure);

    // Listamos los documentos
    this.getDocumentsType();
    // Obtenemos informacion del guardado parcial de la denuncia
    this.complaintId = this.tokenService.getItemValidateToken('complaintId');

    // Inicializar hasFiles desde localStorage si existe
    const denuncia = localStorage.getItem(LOCALSTORAGE.DENUNCIA_KEY);

    if (denuncia) {
      const denunciaData = JSON.parse(this.cryptService.decrypt(denuncia));
      const hasEntidadFiles = denunciaData.entidad?.archivoPerfil?.anexos?.length > 0;
      const hasAnexosAsociados = denunciaData.anexosAsociados?.anexos?.length > 0;
      const hasMedidaProteccion = denunciaData.medidaProteccion?.anexos?.length > 0;
      this.hasFiles = hasEntidadFiles || hasAnexosAsociados || hasMedidaProteccion;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngOnDestroy(): void {
    this.suscriptions.forEach((s) => s.unsubscribe());
    clearTimeout(this.timer);
  }

  /*********************/
  /*    GET METHODS    */
  /*********************/

  get isPNPoPJoCZ(): boolean {
    return [SLUG_PROFILE.PNP, SLUG_PROFILE.PJ, SLUG_PROFILE.CITIZEN].includes(this.tmpProfile as any);
  }

  get isEntity(): boolean {
    return [SLUG_PROFILE.ENTITY].includes(this.tmpProfile as any);
  }

  get formsValidation(): boolean {
    return (
      this.isLugarHechoValido() &&
      this.isDelitoValido() &&
      this.hasPartes() &&
      this.isPerfilValido() &&
      this.anexosValidos() &&
      this.hasRequiredFiles()
    );
  }

  private isLugarHechoValido(): boolean {
    const lugar = this.data.lugarHecho;
    return (
      !!lugar &&
      Object.keys(lugar).length > 0 &&
      !!lugar.direccion &&
      !!lugar.ubigeo &&
      !!lugar.fechaHecho
    )
  }

  private isDelitoValido(): boolean {
    const hecho = this.data.delito?.hecho?.trim() || '';
    return (
      hecho.length >= 100 &&
      hecho.length <= 4000 &&
      !!this.data.delito?.idEspecialidad
    );
  }

  private hasPartes(): boolean {
    const agraviadas = this.data.partesAgraviadas;
    const denunciadas = this.data.partesDenunciadas;
    return (
      agraviadas &&
      Object.keys(agraviadas).length > 0 &&
      denunciadas &&
      Object.keys(denunciadas).length > 0
    );
  }

  private isPerfilValido(): boolean {
    return (
      this.isCiudadano() ||
      this.isPNP() ||
      this.isPJValido() ||
      this.isEntidad()
    );
  }

  private isCiudadano(): boolean {
    const c = this.data.ciudadano;
    const esAbogado = c?.denunciaAbogado;
    const abogadoCompleto =
      !!c?.idColegioAbogado &&
      typeof c?.numeroColegiatura === 'string' &&
      /^\d{5,6}$/.test(c.numeroColegiatura.trim());
    return (
      this.tmpProfile === SLUG_PROFILE.CITIZEN &&
      (!esAbogado || abogadoCompleto)
    )
  }

  private isPNP(): boolean {
    const p = this.data.policia;
    return (
      this.tmpProfile === SLUG_PROFILE.PNP &&
      getValidString(this.data.numeroInformePolicial) !== null &&
      !!getValidString(p?.codigoCip) &&
      !!getValidString(p?.numeroPartePolicial) &&
      !!p?.dependenciaPolicial &&
      !!p?.ubigeo
    );
  }

  private isPJValido(): boolean {
    const juzgado = this.data.juzgado;
    const medida = this.data.medidaProteccion;
    const hasMedida =
      !this.protectiveMeasure ||
      (!!medida?.idTipoRiesgo && !!medida?.idsTipoViolencia);

    return (
      this.tmpProfile === SLUG_PROFILE.PJ &&
      !!getValidString(this.data.nroExpediente) &&
      !!juzgado?.ubigeo &&
      !!juzgado?.coEntidad &&
      !!juzgado?.fechaDenuncia &&
      hasMedida
    );
  }

  private isEntidad(): boolean {
    const entidad = (this.data.entidad || {}) as Entidad
    const ruc = entidad.ruc ?? ''
    const razonSocial = entidad.razonSocial ?? ''
    const rucNum = Number(ruc)
    return (
      this.tmpProfile === SLUG_PROFILE.ENTITY &&
      Object.keys(entidad).length > 0 &&
      ruc.length === SLUG_MAX_LENGTH.RUC &&
      !isNaN(rucNum) &&
      razonSocial.trim().length > 0
    )
  }

  private anexosValidos(): boolean {
    const anexos: any = this.data.anexosAsociados || {};
    return (
      Object.keys(anexos).length === 0 ||
      anexos.observacion === null ||
      (anexos.observacion?.length <= 1000)
    );
  }

  private hasRequiredFiles(): boolean {
    return this.tmpProfile === SLUG_PROFILE.CITIZEN ? true : this.hasFiles;
  }

  public countWords(value: string): number {
    return value?.trim().length !== 0 ? value?.trim().split(/\s+/).length : 0;
  }

  /************************/
  /*    DOCUMENT TYPES    */
  /************************/

  public getDocumentsType(): void {
    const origenID = 0;
    this.suscriptions.push(
      this.maestrosService.getDocumentTypes(origenID).subscribe({
        next: (resp) => {
          if (resp.code && resp.code === 200) {
            this.documentTypes = resp.data.map((d) => ({
              code: d.id,
              name: d.nombre.toUpperCase,
            }));
          }
        },
      })
    );
  }

  public getGeneralData({
    numeroInformePolicial,
    codigoCip,
    nroExpediente,
    medidaProteccion,
  }: any): Object {
    return {
      numeroInformePolicial,
      codigoCip,
      nroExpediente,
      medidaProteccion,
    };
  }

  /****************************/
  /*    GET COMPLAINT DATA    */
  /****************************/

  private getComplaintData(): void {
    this.mesaService.getComplaintData(this.complaintId).subscribe({
      next: (resp) => {
        if (resp.codigo && resp.codigo === 200) {
          if (resp.data.dataPreliminar) {
            const recovered = this.cryptService.decrypt(
              resp.data.dataPreliminar
            );
            if (recovered !== '') {
              this.data = JSON.parse(recovered) as Denuncia;
              this.savedData = { ...this.data };
            }
          }
        }
      },
    });
  }

  readFile(file: any): Promise<ArrayBuffer | string | null> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => {
        if (error instanceof Error) {
          reject(error);
        } else {
          reject(new Error(String(error)));
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  /******************/
  /*    AUTOSAVE    */
  /******************/

  public onFormChange(newValues: Object): void {
    this.data = {
      ...this.data,
      ...newValues,
      id: this.complaintId,
    };

    this.amountMedidaProteccion = 0;
    this.amountAnexo = 0;
    this.amountRepresentanteLegal = this.data.entidad?.archivoPerfil?.anexos?.[0]?.tamanyo ?? 0;

    let foliosTotal = 0;

    if (this.data.anexosAsociados?.anexos) {
      this.data.anexosAsociados.anexos.forEach((anexo) => {
        this.amountAnexo = this.amountAnexo + anexo.tamanyo;
        foliosTotal = foliosTotal + anexo.numeroFolios;
      });
    }

    this.data.totalPaginas = foliosTotal;

    this.sumTotalBytesFiles =
      this.amountAnexo +
      this.amountMedidaProteccion +
      this.amountRepresentanteLegal;

    if ('force' in newValues) {
      const newData = { ...this.data };
      delete newData.force;
      this.data = { ...newData };
      //this.saveUserData()
      return;
    }

    // Verificar si se cambió alguna fecha para validarla
    if ('fechaCambio' in newValues && this.tmpProfile === SLUG_PROFILE.PNP && this.data.lugarHecho?.fechaHecho && this.data.fechaPolicial) {
      this.validaFechaDenuncia();
    }

    // Verificar si cambió la hora del hecho
    if ('horaCambio' in newValues && newValues['horaCambio'] === true) {
      this.validaHoraHecho();
    }

    // Verificar si cambió la fecha del hecho
    if ('fechaCambio' in newValues && newValues['fechaCambio'] === true) {
      this.validaHoraHecho();
    }

    // Reiniciar el temporizador para esperar nuevamente el período de tiempo configurado
    clearTimeout(this.timer);
  }

  public verifyData(data: Denuncia) {
    if (this.tmpProfile === SLUG_PROFILE.CITIZEN) {
      data['numeroInformePolicial'] = null;
      data['codigoCip'] = null;
      data['nroExpediente'] = null;
      data['medidaProteccion'] = null;
      data['entidad'] = null;
      data['partesDenunciantes'] = {};
    }

    if (this.tmpProfile === SLUG_PROFILE.PNP) {
      data['nroExpediente'] = null;
      data['fechaPolicial'] = null;
      data['medidaProteccion'] = null;
      data['entidad'] = null;
    }

    if (this.tmpProfile === SLUG_PROFILE.PJ) {
      data['numeroInformePolicial'] = null;
      data['codigoCip'] = null;
      data['entidad'] = null;
      if (this.protectiveMeasure !== 1) {
        data['medidaProteccion'] = null;
      }
    }

    if (this.tmpProfile === SLUG_PROFILE.ENTITY) {
      data['numeroInformePolicial'] = null;
      data['codigoCip'] = null;
      data['nroExpediente'] = null;
      data['medidaProteccion'] = null;
      data['partesDenunciantes'] = {};
    }

    return data;
  }

  public isFormDataChanged(): boolean {
    return JSON.stringify(this.data) !== JSON.stringify(this.savedData);
  }

  /*******************/
  /*  GO TO PREVIEW  */
  /*******************/

  public nextStep(): void {
    // Validar que la fecha y hora del hora del hecho sea válida
    if (!validateDateTime(`${this.data.lugarHecho.fechaHecho} ${this.data.lugarHecho.horaHecho ? this.data.lugarHecho.horaHecho + ':00' : '00:00:00'}`)) {
      this.messageService.add({
        severity: 'warn',
        detail:
          'La fecha y hora del hecho no pueden ser posterior a la fecha y hora actual',
      });

      this.expanded = false;

      setTimeout(() => {
        this.expanded = true;

        const element = this.elementRef.nativeElement.querySelector('#horaHecho');

        const offset = 200;
        const rect = element?.getBoundingClientRect();
        const top = rect?.top + window.scrollY;

        window.scrollTo({
          top: top - offset,
          left: 0,
          behavior: 'smooth',
        });
      }, 0);

      return;
    }

    localStorage.setItem(DENUNCIA_KEY, this.cryptService.encrypt(JSON.stringify(this.data)));

    this.router.navigate(['/realizar-denuncia/confirmacion']);
  }

  validaFechaDenuncia(): boolean {
    if (this.tmpProfile === SLUG_PROFILE.PNP && this.data.lugarHecho?.fechaHecho
      && this.data.fechaPolicial && (this.data.lugarHecho.fechaHecho > this.data.fechaPolicial)) {

      this.messageService.clear();

      this.messageService.add({
        severity: 'warn',
        detail: 'La fecha del hecho no puede ser posterior a la fecha de la denuncia policial',
      });

      this.expanded = false;

      setTimeout(() => {
        this.expanded = true;
        const element = this.elementRef.nativeElement.querySelector('#fechaHecho');
        const offset = 200;
        const rect = element?.getBoundingClientRect();
        const top = rect?.top + window.scrollY;

        window.scrollTo({
          top: top - offset,
          left: 0,
          behavior: 'smooth',
        });
      }, 0);

      return false;
    }

    return true;
  }

  validaHoraHecho(): boolean {
    return false;
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

  /**********************/
  /*  BACK VERIFICATION */
  /**********************/

  public backPersonalData(): void {
    this.router.navigate(['realizar-denuncia/datos-especialidad']);
  }

  public onFechaDenunciaChange(fecha: Date): void {
    this.fechaPolicial = fecha;
  }

  protected readonly SLUG_INVOLVED = SLUG_INVOLVED;

  public onFilesChanged(hasFiles: boolean): void {
    this.hasFiles = hasFiles;
  }

  public validateAndShowMissingFields(): void {
    const missingFields: string[] = [];

    this.validateLugarHecho(missingFields);
    this.validateDelito(missingFields);
    this.validatePartes(missingFields);
    this.validateEntidad(missingFields);
    this.validateAnexos(missingFields);

    this.showValidationResult(missingFields);
  }

  private validateLugarHecho(missingFields: string[]): void {
    const lugar = this.data.lugarHecho;
    if (!lugar?.direccion || !lugar?.ubigeo || !lugar?.fechaHecho) {
      missingFields.push('❌ Lugar del hecho: Falta completar dirección, ubigeo o fecha del hecho');
    }
  }

  private validateDelito(missingFields: string[]): void {
    const delito = this.data.delito;
    const desc = delito?.hecho?.trim() || '';
    if (!desc || desc.length < 100 || desc.length > 4000 || !delito.idEspecialidad) {
      missingFields.push('❌ Delito: Falta descripción del hecho (entre 100 y 4000 caracteres) o especialidad');
    }
  }

  private validatePartes(missingFields: string[]): void {
    if (!this.data.partesAgraviadas || Object.keys(this.data.partesAgraviadas).length === 0) {
      missingFields.push('❌ Partes: Falta agregar al menos una parte agraviada');
    }
    if (!this.data.partesDenunciadas || Object.keys(this.data.partesDenunciadas).length === 0) {
      missingFields.push('❌ Partes: Falta agregar al menos una parte denunciada');
    }
  }

  private validateEntidad(missingFields: string[]): void {
    if (this.tmpProfile !== SLUG_PROFILE.ENTITY) return;

    const entidad: any = this.data.entidad || {};
    const ruc = entidad?.ruc;
    const razon = entidad?.razonSocial;

    if (!entidad || Object.keys(entidad).length === 0) {
      missingFields.push('❌ Entidad: No se han registrado los datos de la entidad');
      return;
    }

    if (!ruc) {
      missingFields.push('❌ Entidad: Falta RUC');
    } else if (isNaN(Number(ruc)) || ruc.length !== SLUG_MAX_LENGTH.RUC) {
      missingFields.push('❌ Entidad: El RUC debe ser un número válido de 11 dígitos');
    }

    if (!razon) {
      missingFields.push('❌ Entidad: Falta razón social');
    }

    if (!this.hasFiles) {
      missingFields.push('❌ Entidad: Falta adjuntar documento de representación');
    }
  }

  private validateAnexos(missingFields: string[]): void {
    const obs = this.data.anexosAsociados?.observacion;
    if (obs && obs.length > 1000) {
      missingFields.push('❌ Anexos: La observación no debe exceder los 1000 caracteres');
    }
  }

  private showValidationResult(missingFields: string[]): void {
    const message = missingFields.length > 0
      ? {
        severity: 'error',
        summary: 'Campos incompletos',
        detail: missingFields.join('\n'),
        styleClass: 'mpfn-toast-validation'
      }
      : {
        severity: 'success',
        summary: 'Validación exitosa',
        detail: 'Todos los campos requeridos han sido completados correctamente'
      };

    this.messageService.add(message);
  }

  /** NO PROPAGAR EL FUNCIONAMIENTO DEL ACORDEON */
  stopAccordionKeyPropagation(event: KeyboardEvent): void {
    const keysToBlock = new Set(['Home', 'End']);
    if (keysToBlock.has(event.key)) event.stopPropagation();
  }

}
