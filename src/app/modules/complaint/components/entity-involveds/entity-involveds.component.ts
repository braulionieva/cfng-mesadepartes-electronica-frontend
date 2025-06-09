import { Component, Input, OnDestroy, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

//primeng
import { RadioButtonModule } from 'primeng/radiobutton';
import { DropdownModule } from 'primeng/dropdown';
import { DividerModule } from 'primeng/divider';

//mpfn
import { CmpLibModule, ctrlErrorMsg } from "ngx-mpfn-dev-cmp-lib";
import { FnIcon } from 'ngx-mpfn-dev-cmp-lib/lib/shared/interfaces/fn-icon';
import {
  iUser,
  iTrashCan
} from "ngx-mpfn-dev-icojs-regular";

//helpers
import {
  SLUG_DOCUMENT_TYPE,
  SLUG_ENTITY,
  SLUG_INVOLVED,
  SLUG_INVOLVED_ROL,
  SLUG_MAX_LENGTH,
  SLUG_OTHER,
  SLUG_PERSON_TYPE,
} from "@shared/helpers/slugs";
import { ButtonModule } from 'primeng/button';
import { Involved } from '@modules/complaint/interfaces/Involved';
import { Subscription, lastValueFrom } from 'rxjs';
import { ExtraDataModalComponent } from '../extra-data-modal/extra-data-modal.component';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { ValidationService } from '@shared/services/shared/validation.service';
import { TokenService } from '@shared/services/auth/token.service';
import { EntidadInvolucrada, Involucrado, Lqrr, Persona } from '@shared/interfaces/complaint/complaint-registration';
import { formatDate, getDateFromString, getValidString } from '@shared/utils/utils';
import { ToastModule } from 'primeng/toast';
import { ValidateReniec } from '@shared/interfaces/verification/validate-reniec';
import { SYSTEM_CODE } from '@environments/environment';
import { MaestrosService } from '@shared/services/shared/maestros.service';
import { VerificationService } from '@shared/services/complaint-registration/verification.service';
import { ValidarInputDirective } from '@core/directives/validar-input.directive';

@Component({
  selector: 'complaint-entity-involveds',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RadioButtonModule,
    DropdownModule,
    CmpLibModule,
    DividerModule,
    ButtonModule,
    DynamicDialogModule,
    ToastModule,
    ValidarInputDirective
  ],
  providers: [DialogService, MessageService],
  templateUrl: './entity-involveds.component.html',
  styles: [
    `
      :host::ng-deep .p-button-active .p-button-label {
          color: #0069d9 !important;
      }
    `
  ]
})
export class EntityInvolvedsComponent implements OnInit, OnChanges, OnDestroy {

  @Input()
  public type: 'agraviado' | 'denunciado' = SLUG_INVOLVED.AGRAVIADO;
  @Input()
  public documentTypes = []
  @Input()
  public recoveredData: Involucrado | null = null
  @Output()
  public formChanged = new EventEmitter<Object>()

  /********************/
  /*    CONSTANTES    */
  /********************/

  public SLUG_INVOLVED_ROL = SLUG_INVOLVED_ROL;
  public SLUG_DNI = SLUG_DOCUMENT_TYPE.DNI;
  public SLUG_OTHER = SLUG_OTHER;

  /*******************/
  /*    VARIABLES    */
  /*******************/

  public selectedInvolvedRol: any = null;
  public listInvolvedRoles = []

  public tmpEntities = [
    { name: 'CEM', key: SLUG_ENTITY.CEM },
    { name: 'Persona Jurídica', key: SLUG_ENTITY.JURIDICA },
    { name: 'Procuraduría', key: SLUG_ENTITY.PROCURADURIA },
  ]

  public procuratorList = []
  public cemList = []

  public EntityDataForm: FormGroup = this.createEntityFreshForm()
  public PNDataForm: FormGroup

  public refModal: DynamicDialogRef;

  public involveds: Involved[] = []
  public tmpInvolved: Involved

  public newInvolved: boolean = false
  public editing: boolean = false
  public searchingRuc: boolean = false
  public rucFounded: boolean = false
  public loadingData: boolean = false
  public formInitialized: boolean = false
  public questionAnswered: boolean = false //si marqué como agraviado
  public userData

  public suscriptions: Subscription[] = []
  public validating = false
  private readonly ip: string = ''
  private readonly system: string = SYSTEM_CODE

  //icons
  public iUser: FnIcon = iUser as FnIcon
  public iTrashCan: FnIcon = iTrashCan as FnIcon

  /*********************/
  /*    CONSTRUCTOR    */
  /*********************/

  constructor(
    public readonly dialogService: DialogService,
    private readonly tokenService: TokenService,
    private readonly validationService: ValidationService,
    private readonly messageService: MessageService,
    private readonly maestrosService: MaestrosService,
    private readonly verificationService: VerificationService,
  ) { }

  /********************/
  /*    LIFE CYCLE    */
  /********************/

  ngOnInit(): void {
    this.listInvolvedRoles = this.getListInvolvedRoles()
    this.selectedInvolvedRol = this.listInvolvedRoles[0].key
    this.userData = this.tokenService.getDecoded()
  }

  ngOnChanges(changes: SimpleChanges): void {

    if (changes['recoveredData'] && !this.formInitialized) {
      const { lqrr, entidad, persona } = this.recoveredData

      if (this.recoveredData !== null && (lqrr || entidad || persona)) {
        this.questionAnswered = true
        this.formInitialized = true

        // Loading information
        this.loadingData = true

        persona && this.setInvolved(persona);
        entidad && this.setEntity(entidad);
        lqrr && this.setLqrr(lqrr);

        this.loadingData = false

      }
    }

  }

  ngOnDestroy(): void {
    this.suscriptions.forEach(s => s.unsubscribe())
  }

  /***************/
  /*    FORM    */
  /**************/

  private createEntityFreshForm(involved: Involved = null): FormGroup {
    return new FormGroup({
      entityType: new FormControl(
        involved?.entityType || null,
        [Validators.required
        ]),
      // Legal entity
      ruc: new FormControl(
        involved?.ruc || '',
        [Validators.required,
          // Validators.min(11), Validators.max(11)
        ]),
      businessName: new FormControl(
        { value: involved?.businessName || '', disabled: true },
        [Validators.required
        ]),
      legalRepresentative: new FormControl(
        involved?.legalRepresentative || '',
        [Validators.required
        ]),
      // Procurator
      procuratorOffice: new FormControl(
        involved?.procuratorOffice || null,
        [Validators.required
        ]),
      procuratorDNI: new FormControl(
        involved?.procuratorDNI || '',
        [Validators.required,
          // Validators.min(8), Validators.max(8)
        ]),
      procuratorName: new FormControl(
        involved?.procuratorName || '',
        [Validators.required
        ]),
      // CEM
      cem: new FormControl(involved?.cem || null, [
        Validators.required
      ]),
      validated: new FormControl(
        involved?.validated ||
        false
      ),
      entityName: new FormControl(involved?.entityName || '', [
        Validators.required
      ])
    })
  }

  private createPNFreshForm(involved: Involved = null): FormGroup {
    return new FormGroup({
      documentType: new FormControl(
        involved?.documentType || '',
        [Validators.required]
      ),
      documentNumber: new FormControl(
        involved?.documentNumber || '',
        [Validators.required]
      ),
      names: new FormControl(
        involved?.names || '',
        [Validators.required]
      ),
      fatherLastName: new FormControl(
        involved?.fatherLastName || '',
        [Validators.required]
      ),
      motherLastName: new FormControl(
        involved?.motherLastName || ''
      ),
      validated: new FormControl(
        involved?.validated ||
        false
      ),
    })
  }

  /*********************/
  /*    GET METHODS    */
  /*********************/

  get isAggrieved(): boolean {
    return this.type === SLUG_INVOLVED.AGRAVIADO
  }

  get isDenounced(): boolean {
    return this.type === SLUG_INVOLVED.DENUNCIADO
  }

  get componentMessage(): string {
    const aggrievedMessage = 'Aquí podrá agregar a las personas (naturales o jurídicas) afectadas, perjudicadas o que han sufrido daño alguno por este acto delictivo.'
    const denouncedMessage = 'Aquí podrá agregar al denunciante titular.\n\n Porfavor consigne los datos del denunciante segun su DNI.'

    return (this.isAggrieved ? aggrievedMessage : denouncedMessage)
  }

  get isLegalPerson(): boolean {
    return this.selectedInvolvedRol === SLUG_INVOLVED_ROL.ENTIDAD
      && this.EntityDataForm.controls['entityType'].value === SLUG_ENTITY.JURIDICA;
  }

  get isProcuratorOffice(): boolean {
    return this.selectedInvolvedRol === SLUG_INVOLVED_ROL.ENTIDAD
      && this.EntityDataForm.controls['entityType'].value === SLUG_ENTITY.PROCURADURIA;
  }

  get isCEM(): boolean {
    return this.selectedInvolvedRol === SLUG_INVOLVED_ROL.ENTIDAD
      && this.EntityDataForm.controls['entityType'].value === SLUG_ENTITY.CEM;
  }

  get validEntityFormInvalid(): boolean {
    let entityType = this.EntityDataForm.controls['entityType'].value
    let valid = entityType && (
      (entityType === SLUG_ENTITY.JURIDICA
        && this.EntityDataForm.controls['ruc'].valid
        && this.EntityDataForm.controls['businessName'].value !== ''
        && this.EntityDataForm.controls['legalRepresentative'].valid
      )
      || (entityType === SLUG_ENTITY.PROCURADURIA
        && this.EntityDataForm.controls['procuratorOffice'].valid
        && this.EntityDataForm.controls['procuratorDNI'].valid
        && this.EntityDataForm.controls['procuratorName'].valid
        && (
          this.EntityDataForm.controls['procuratorOffice'].value !== SLUG_OTHER.PROCURADURIA ||
          //Custom procuradoria
          (this.EntityDataForm.controls['procuratorOffice'].value === SLUG_OTHER.PROCURADURIA &&
            this.EntityDataForm.controls['entityName'].valid
          )
        )
      )
      || (entityType === SLUG_ENTITY.CEM
        && this.EntityDataForm.controls['cem'].valid
        && (
          this.EntityDataForm.controls['cem'].value !== SLUG_OTHER.CEM ||
          //Custom cem
          (this.EntityDataForm.controls['cem'].value === SLUG_OTHER.CEM &&
            this.EntityDataForm.controls['entityName'].valid
          )
        )
      )
    )
    return !valid;
  }

  get enableAditionalDataBtn(): boolean {
    return (
      this.selectedInvolvedRol === SLUG_INVOLVED_ROL.CONOCIDO
      && this.PNDataForm.valid
    )
  }

  get availableSaveBtn(): boolean {
    return !this.showAggrievedQuestion;
  }

  get disabledBtn(): boolean {
    if (!this.newInvolved) return false;
    if (this.selectedInvolvedRol === SLUG_INVOLVED_ROL.ENTIDAD) return this.validEntityFormInvalid;
    if (this.selectedInvolvedRol === SLUG_INVOLVED_ROL.CONOCIDO) return this.PNDataForm.invalid;
    return false;
  }


  get questionMessageForAggrieved(): string {
    return '¿Usted es el agraviado?'
  }

  get showAggrievedQuestion(): boolean {
    return (
      this.type === SLUG_INVOLVED.AGRAVIADO &&
      !this.questionAnswered
    )
  }

  get isInvalidNumber(): boolean {
    return this.errorMsg('ruc') !== '';
  }

  get getDocumentTypes(): any[] {
    return this.documentTypes.filter(x => x.code !== SLUG_DOCUMENT_TYPE.RUC);
  }

  get isDisabledLqrr() {
    return this.involveds.findIndex(x => x.involvedRol === SLUG_INVOLVED_ROL.DESCONOCIDO) !== -1
  }

  get otherProcuradoria(): boolean {
    return this.selectedInvolvedRol === SLUG_INVOLVED_ROL.ENTIDAD &&
      this.EntityDataForm.get('entityType').value === SLUG_ENTITY.PROCURADURIA &&
      this.EntityDataForm.get('procuratorOffice').value === SLUG_OTHER.PROCURADURIA
  }

  get otherCem(): boolean {
    return this.selectedInvolvedRol === SLUG_INVOLVED_ROL.ENTIDAD &&
      this.EntityDataForm.get('entityType').value === SLUG_ENTITY.CEM &&
      this.EntityDataForm.get('cem').value === SLUG_OTHER.CEM
  }

  get isDNI(): boolean {
    return this.selectedInvolvedRol === SLUG_INVOLVED_ROL.CONOCIDO &&
      this.PNDataForm.get('documentType').value === SLUG_DOCUMENT_TYPE.DNI
  }

  get isNoDocument(): boolean {
    return this.selectedInvolvedRol === SLUG_INVOLVED_ROL.CONOCIDO &&
      this.PNDataForm.get('documentType').value === SLUG_DOCUMENT_TYPE.SIN_DOCUMENTO
  }

  get validLength(): number | boolean {
    if (this.isDNI) {
      return 8;
    }
    return false;
  }

  get invalidRuc(): boolean {
    return !(this.selectedInvolvedRol === SLUG_INVOLVED_ROL.ENTIDAD &&
      this.EntityDataForm.get('ruc').value.length === SLUG_MAX_LENGTH.RUC &&
      !isNaN(this.EntityDataForm.get('ruc').value))
  }


  /********************************/
  /*    ON CHANGE DOCUMENT TYPE   */
  /********************************/

  public onChangeDocumentType(type: number) {
    // Control
    let control = this.PNDataForm.get('documentNumber')
    // Clean document number
    control.setValue('')
    control.markAsUntouched()
    // In case is type 'Sin Documento', remove validators
    if (type === SLUG_DOCUMENT_TYPE.SIN_DOCUMENTO) {
      control.clearValidators()
      control.updateValueAndValidity()
      return;
    }
    const validLength = this.validLength;
    const validators = typeof (validLength) === 'number' ? [Validators.minLength(validLength), Validators.maxLength(validLength)] : []
    control.setValidators([Validators.required, ...validators])
    control.updateValueAndValidity()
  }

  /************************/
  /*    ROLES INVOLVES    */
  /************************/

  public getListInvolvedRoles() {
    if (this.type === SLUG_INVOLVED.AGRAVIADO)
      return [
        { name: 'Entidad', key: 'entidad' },
        { name: 'Persona natural', key: 'conocido' }
      ]
    else
      return [
        { name: 'Entidad', key: 'entidad' },
        { name: 'Persona natural', key: 'conocido' },
        { name: 'Desconocido', key: 'desconocido' }
      ]
  }

  public changeInvolvedRole(value) {

    this.clearSecundaryForms()

    if (SLUG_INVOLVED_ROL.ENTIDAD === value)
      this.EntityDataForm = this.createEntityFreshForm();
    if (SLUG_INVOLVED_ROL.CONOCIDO === value)
      this.PNDataForm = this.createPNFreshForm()
    if (SLUG_INVOLVED_ROL.DESCONOCIDO === value) {
      if (this.isDisabledLqrr && !this.editing) {
        setTimeout(() => {
          this.selectedInvolvedRol = SLUG_INVOLVED_ROL.ENTIDAD
          this.EntityDataForm = this.createEntityFreshForm();
          this.messageService.add({ severity: 'warn', detail: `Ya ha registrado un LQRR en la sección ${this.type}` })
        }, 0);
        return
      }
      this.PNDataForm = this.createPNFreshForm()
      this.PNDataForm.controls['names'].setValue('LQRR')
    }
  }

  public selectType() {
    const recoverType = this.EntityDataForm.controls['entityType'].value;
    this.EntityDataForm = this.createEntityFreshForm();
    this.rucFounded = false
    this.EntityDataForm.controls['entityType'].setValue(recoverType);
  }
  /********************/
  /*    SEARCH RUC    */
  /********************/

  /*public searchRUC(): void {
    if (!this.validateIfInvolvedExist()) {
      this.searchingRuc = true
      this.rucFounded = false
      this.EntityDataForm.get('validated').setValue(false)
      this.suscriptions.push(
        this.validationService.getPadronSunatPorRuc(this.EntityDataForm.get('ruc').value).subscribe({
          next: resp => {
            this.searchingRuc = false
            if (resp) {
              this.rucFounded = true
              this.EntityDataForm.get('businessName').setValue(resp[0].razonSocial)//reemplazo de resp.razonSocial
              this.EntityDataForm.get('validated').setValue(true)
            }
          },
          error: (error) => {
            this.searchingRuc = false
            this.messageService.add({ severity: 'warn', detail: error.error.mensaje })
          }
        })
      )
    }
  }*/
  public searchRUC(): void {
    if (!this.validateIfInvolvedExist()) {
      this.searchingRuc = true;
      this.rucFounded = false;
      this.EntityDataForm.get('validated').setValue(false);

      this.suscriptions.push(
        this.validationService.getPadronSunatPorRuc(this.EntityDataForm.get('ruc').value).subscribe({
          next: resp => {
            this.searchingRuc = false;
            if (resp) {
              this.rucFounded = true;
              this.EntityDataForm.get('businessName').setValue(resp[0].razonSocial);
              this.EntityDataForm.get('validated').setValue(true);
            } else {
              // Caso donde la respuesta es null o vacía
              this.messageService.add({
                severity: 'warn',
                detail: 'No se encontró la razón social para el RUC ingresado.'
              });
            }
          },
          error: (error) => {
            this.searchingRuc = false;

            // RUC no existe - HTTP 422
            if (error.status === 422 && error.error?.code === '42202009') {
              this.messageService.add({
                severity: 'warn',
                detail: 'El Nº de RUC ingresado NO existe'
              });
            }
            // Servicio no disponible
            else if ([0, 404, 500, 502, 503, 504].includes(error.status)) {
              this.messageService.add({
                severity: 'error',
                summary: 'Servicio no disponible',
                detail: 'El servicio del SUNAT no se encuentra disponible en este momento. Por favor inténtelo nuevamente más tarde o acérquese a una Mesa Única de Partes.',
                sticky: true
              });
            }
            // Si hay un mensaje específico del error, usarlo
            else if (error.error?.mensaje) {
              this.messageService.add({
                severity: 'warn',
                detail: error.error.mensaje
              });
            }
            // Otros errores genéricos
            else {
              this.messageService.add({
                severity: 'error',
                detail: 'Ocurrió un error al consultar el RUC. Por favor intente nuevamente.'
              });
            }
          }
        })
      );
    }
  }

  public cleanSearch(): void {
    this.rucFounded = false
    this.EntityDataForm.get('ruc').setValue('')
    this.EntityDataForm.get('ruc').markAsUntouched()
    this.EntityDataForm.get('businessName').setValue('')
  }

  /************************************/
  /*    VALIDATE IF INVOLVED EXIST    */
  /************************************/

  public validateIfInvolvedExist(): boolean {
    return false
  }
  /***********************************/
  /*    EXTRA DATA PERSONA NATURAL   */
  /***********************************/

  public recordExtraData(): void {
    this.refModal = this.dialogService.open(ExtraDataModalComponent, {
      header: `Datos adicionales del ${this.type}`,
      contentStyle: { 'max-width': '1000px' },
      data: this.tmpInvolved ? this.tmpInvolved : { ...this.PNDataForm.value }
    })

    this.refModal.onClose.subscribe((involved) => {
      if (involved) {
        this.tmpInvolved = involved
        this.createInvolved()
      }
    })

  }

  /*************************/
  /*    CREATE INVOLVED    */
  /*************************/

  public async createInvolved(): Promise<void> {
    //si no hay creación presente de involucrado
    if (!this.newInvolved) {
      this.selectedInvolvedRol = this.listInvolvedRoles[0].key
      this.EntityDataForm = this.createEntityFreshForm()
      this.newInvolved = true
      return
    }
    //Si ya esta activo el modo edicion
    const valueForm = this.selectedInvolvedRol === SLUG_INVOLVED_ROL.ENTIDAD ? this.EntityDataForm.getRawValue() : this.PNDataForm.getRawValue();

    let entityName: string | null = null;
    if (this.selectedInvolvedRol === SLUG_INVOLVED_ROL.ENTIDAD && valueForm.entityType !== SLUG_ENTITY.JURIDICA) {
      if (valueForm.entityType === SLUG_ENTITY.PROCURADURIA) {
        entityName = this.getProcuratorOfficeName(valueForm.procuratorOffice);
      } else {
        entityName = this.getCemName(valueForm.cem);
      }
    }
    this.tmpInvolved = {
      ...this.tmpInvolved,
      ...valueForm,
      involvedRol: this.selectedInvolvedRol,
      entityName
    };


    if (this.validateIfInvolvedExist()) {
      return
    }
    let validated = this.tmpInvolved.validated;

    // Validar con Reniec
    if (this.tmpInvolved.documentType === this.SLUG_DNI) {
      validated = await this.validateReniec(this.tmpInvolved);
    }

    if (this.tmpInvolved.id) {
      this.updateInvolved({
        ...this.tmpInvolved,
        validated
      })
    } else {

      this.involveds.push({
        ...this.tmpInvolved,
        id: this.generateId(),
        validated
      })

    }

    this.tmpInvolved = undefined;
    this.newInvolved = false;
    this.saveInfo()
  }

  /***************************/
  /*    VALIDATE INVOLVED    */
  /***************************/

  public async validateReniec(involved: Involved): Promise<boolean> {
    this.validating = true;

    let request: ValidateReniec = {
      numeroDocumento: involved.documentNumber,
      nombres: involved.names,
      apellidoPaterno: involved.fatherLastName,
      apellidoMaterno: involved.motherLastName,
      tipoVinculo: '',
      apoderado: '',
      ip: getValidString(this.ip) || '0.0.0.0'
    };

    try {

      const body = Object.fromEntries(
        Object.entries(request).filter(([_, valor]) => valor !== null)
      ) as ValidateReniec;

      const resp = await lastValueFrom(this.verificationService.validateReniec(body));
      this.validating = false;

      if (resp && resp.codigo === 200 && resp.data) {
        return true;
      }

      return false;

    } catch (error) {
      console.error(error);
      this.validating = false;
      return false;
    }

  }

  private updateInvolved(involved: Involved): void {
    const indexFound = this.involveds.findIndex(i => i.id === involved.id)
    this.involveds.splice(indexFound, 1, involved)
    this.editing = false
    this.saveInfo()
  }

  /************************/
  /*    CANCEL EDITION    */
  /************************/

  public cancelEdition(): void {
    this.newInvolved = false
    this.editing = false
    this.tmpInvolved = undefined
  }

  /*************************/
  /*    DELETE INVOLVED    */
  /*************************/

  public deleteInvolved(id: string): void {
    const indexFound = this.involveds.findIndex(i => i.id === id)
    this.involveds.splice(indexFound, 1)
    this.cancelEdition()
    this.saveInfo()
    // In case all is deleted
    if (this.involveds.length < 1) {
      this.questionAnswered = false
    }
  }

  /******************/
  /*    ASK USER    */
  /******************/

  public answerQuestion(confirm: boolean): void {

    this.questionAnswered = true; //pregunta respondida

    if (confirm) {
      // Registramos al usuario de la sesión
      this.involveds.push({
        id: this.generateId(),
        documentNumber: this.userData?.info.dni,
        documentType: SLUG_DOCUMENT_TYPE.DNI,
        names: this.userData?.info.nombres,
        fatherLastName: this.userData?.info.apellidoPaterno,
        motherLastName: this.userData?.info.apellidoMaterno,
        involvedRol: SLUG_INVOLVED_ROL.CONOCIDO,
        validated: true,
      })
      this.setQuestionAnswered()
    }

  }
  public setQuestionAnswered() {
    this.formInitialized = true
    this.saveInfo()
  }

  /*******************/
  /*    READ INFO    */
  /*******************/

  public getProcuratorOfficeName(officeId: number): string {
    if (officeId !== SLUG_OTHER.PROCURADURIA) {
      return this.procuratorList.find(x => x.id === officeId)?.nombre;
    }
    return this.EntityDataForm.get('entityName').value;
  }

  public getCemName(cemId: number): string {
    if (cemId !== SLUG_OTHER.CEM) {
      return this.cemList.find(x => x.id === cemId)?.nombre;
    }
    return this.EntityDataForm.get('entityName').value;
  }

  /*******************/
  /*    READ INFO    */
  /*******************/

  public setLqrr(lqrr: Lqrr) {
    this.involveds.push({
      id: lqrr.id,
      names: 'LQRR',
      involvedRol: SLUG_INVOLVED_ROL.DESCONOCIDO,
    });
  }

  public setEntity(entity: EntidadInvolucrada[]) {
    entity.forEach(e => {
      this.involveds.push({
        id: e.id,
        involvedRol: SLUG_INVOLVED_ROL.ENTIDAD,
        entityType: e.idTipoEntidad,
        procuratorOffice: e.idProcuradoria,
        cem: e.idCentroEmergencia,
        ruc: e.ruc,
        entityName: e.nombreEntidad,
        businessName: e.razonSocial,
        legalRepresentative: e.representanteLegal,
        procuratorDNI: e?.procurador?.dni,
        procuratorName: e?.procurador?.nombre,
        validated: e.validado === 1,
      })
    });
  }

  public setInvolved(person: Persona[]) {
    person.forEach(p => {
      this.involveds.push({
        id: p.id,
        involvedRol: SLUG_INVOLVED_ROL.CONOCIDO,
        documentType: p.idTipoDocumento,
        documentNumber: p.numeroDocumento,
        names: p.nombres,
        fatherLastName: p.apellidoPaterno,
        motherLastName: p.apellidoMaterno,
        gender: p.sexo,
        bornDate: p.fechaNacimiento ? getDateFromString(p.fechaNacimiento) : null,
        age: p.edad ? String(p.edad) : '0',
        idEducationalLevel: p.idGradoInstruccion,
        educationalLevel: p.gradoInstruccion,
        maritalStatus: p.idTipoEstadoCivil,
        nationality: p.idNacionalidad,
        department: p.direccion[0]?.ubigeo ? this.getUbigeo(p.direccion[0].ubigeo, 1) : null,
        province: p.direccion[0]?.ubigeo ? this.getUbigeo(p.direccion[0].ubigeo, 2) : null,
        district: p.direccion[0]?.ubigeo ? this.getUbigeo(p.direccion[0].ubigeo, 3) : null,
        address: p.direccion[0]?.direccionCompleta || '',
        phone: p.contacto?.celularPrincipal,
        email: p.contacto?.correoPrincipal,
        secondaryPhone: p.contacto?.celularSecundario,
        secondaryEmail: p.contacto?.correoSecundario,
        ocupation: p.otrosDatos?.ocupacion,
        disability: p.otrosDatos?.idTipoDiscapacidad,
        lgtbiq: p.otrosDatos?.lgtbiq,
        indigenousVillage: p.otrosDatos?.puebloIndigena,
        nativeLanguage: p.otrosDatos?.idLenguaMaterna,
        translator: p.otrosDatos?.esRequiereTraductor === 1,
        validated: p.validado === 1,
      })
    });
  }

  /***************/
  /*  SAVE INFO  */
  /***************/

  public saveInfo(): void {
    if (this.loadingData) return;
    this.formInitialized = true;

    const data: Involucrado = {};
    this.involveds.forEach(inv => this.addToPayload(data, inv));

    const key = this.type === SLUG_INVOLVED.AGRAVIADO
      ? 'partesAgraviadas'
      : 'partesDenunciadas';

    const payload = { [key]: data };
    this.formChanged.emit(payload);
  }

  private addToPayload(data: Involucrado, inv: Involved): void {
    switch (inv.involvedRol) {
      case SLUG_INVOLVED_ROL.DESCONOCIDO:
        data.lqrr = { id: inv.id };
        break;
      case SLUG_INVOLVED_ROL.CONOCIDO:
        this.addPersona(data, inv);
        break;
      case SLUG_INVOLVED_ROL.ENTIDAD:
        this.addEntidad(data, inv);
        break;
    }
  }

  private addPersona(data: Involucrado, inv: Involved): void {
    const p: Persona = {
      id:                   inv.id,
      idTipoPersona:        SLUG_PERSON_TYPE.NATURAL,
      idTipoDocumento:      inv.documentType,
      numeroDocumento:      inv.documentNumber,
      nombres:              getValidString(inv.names),
      apellidoPaterno:      getValidString(inv.fatherLastName),
      apellidoMaterno:      getValidString(inv.motherLastName),
      sexo:                 inv.gender,
      fechaNacimiento:      inv.bornDate ? formatDate(inv.bornDate) : undefined,
      edad:                 inv.age ? Number(inv.age) : undefined,
      idGradoInstruccion:   inv.idEducationalLevel,
      gradoInstruccion:     inv.educationalLevel,
      idTipoEstadoCivil:    inv.maritalStatus,
      idNacionalidad:       inv.nationality,
      validado:             inv.validated ? 1 : 0,
      flCExtranjero:        (inv.documentType === 4 ||
        inv.documentType === 5 ||
        inv.documentType === 6 ||
        inv.documentType === 9 ||
        inv.documentType === 13||
        inv.documentType === 14) ? 1 : 0,
      // Si tienes lugar de nacimiento en inv, mapea aquí:
      lugarNacimiento:      undefined,
      direccion:            (inv.address || inv.district)
        ? [{ ubigeo: inv.district, direccionCompleta: inv.address }]
        : undefined,
      contacto:             this.showContact(inv)
        ? {
          celularPrincipal:    inv.phone,
          correoPrincipal:     inv.email,
          celularSecundario:   inv.secondaryPhone,
          correoSecundario:    inv.secondaryEmail
        }
        : undefined,
      otrosDatos:           this.showExtraData(inv)
        ? {
          ocupacion:           inv.ocupation,
          idTipoDiscapacidad:  inv.disability,
          lgtbiq:              inv.lgtbiq,
          puebloIndigena:      inv.indigenousVillage,
          idLenguaMaterna:     inv.nativeLanguage,
          esRequiereTraductor: inv.translator ? 1 : 0
        }
        : undefined,
      foto:                 undefined,
      esMayorEdad:          inv.age ? Number(inv.age) >= 18 : undefined
    };

    data.persona = data.persona ?? [];
    data.persona.push(this.cleanNulls(p));
  }


  private addEntidad(data: Involucrado, inv: Involved): void {
    const e: EntidadInvolucrada = {
      id: inv.id,
      idTipoEntidad: inv.entityType,
      // Campos opcionales: sólo los incluimos si existen en `inv`
      idProcuradoria: inv.procuratorOffice ?? undefined,
      idCentroEmergencia: inv.cem ?? undefined,
      ruc: inv.ruc ?? undefined,
      nombreEntidad: getValidString(inv.entityName) || undefined,
      razonSocial: getValidString(inv.businessName) || undefined,
      representanteLegal: getValidString(inv.legalRepresentative) || undefined,
      procurador: this.showProcurator(inv)
        ? {
          origen: '',             // según definición de `Procurador`
          pais: '',
          tipoDocumento: '',
          dni: inv.procuratorDNI,
          nombre: getValidString(inv.procuratorName),
          apellidoPaterno: '',
          apellidoMaterno: '',
        }
        : undefined,
      validado: inv.validated ? 1 : 0,
      // Campos obligatorios sin info en `inv`, se inicializan vacíos
      correoInstitucion: '',
      nuTelefonoEntidad: ''
    };

    data.entidad = data.entidad ?? [];
    data.entidad.push(this.cleanNulls(e));
  }


  /** Elimina claves con valor null o undefined */
  private cleanNulls<T>(obj: T): T {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v != null)
    ) as T;
  }

  /****************/
  /*    OTHERS    */
  /****************/

  public showProcurator(involved: Involved): boolean {
    return (involved.procuratorDNI || involved.procuratorName) ? true : false
  }

  public showContact(involved: Involved): boolean {
    return (involved.phone || involved.email || involved.secondaryPhone || involved.secondaryEmail) ? true : false
  }

  public showExtraData(involved: Involved): boolean {
    return (involved.ocupation || involved.disability || involved.lgtbiq || involved.indigenousVillage || involved.nativeLanguage || involved.translator) ? true : false
  }

  public getName(id: string): string {
    let involved = this.involveds.find(x => x.id === id)
    if (involved.names)
      return `${involved.names?.toUpperCase()} ${involved.fatherLastName?.toUpperCase() || ''} ${involved.motherLastName?.toUpperCase() || ''}`
    if (involved.entityType === SLUG_ENTITY.JURIDICA)
      return `${involved.businessName}`
    if (involved.entityType === SLUG_ENTITY.PROCURADURIA)
      return `${involved.procuratorName?.toUpperCase() || ''} - ${involved.entityName?.toUpperCase() || ''}`
    if (involved.entityType === SLUG_ENTITY.CEM)
      return `${involved.entityName?.toUpperCase() || ''}`
    return ''
  }

  public getTagValidated(idDocumentType: number): string {
    return 'Validado'
  }

  private generateId(): string {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return Date.now().toString(36) + array[0].toString(36);
  }

  public getUbigeo(ubigeo: string, type: number): string | null {

    if (!ubigeo)
      return null;

    const result = ubigeo ? ubigeo.match(/\d{2}/g) : [null, null, null];

    switch (type) {
      case 1: ubigeo = `${result[0]}`; break
      case 2: ubigeo = `${result[0]}${result[1]}`; break
      default: ubigeo = `${result[0]}${result[1]}${result[2]}`; break
    }

    return ubigeo
  }

  public clearSecundaryForms(): void {
    this.EntityDataForm = undefined;
    this.PNDataForm = undefined;
  }

  public errorMsg(ctrlName) {
    return ctrlErrorMsg(this.EntityDataForm.get(ctrlName))
  }

  public errorPNMsg(ctrlName) {
    return ctrlErrorMsg(this.PNDataForm.get(ctrlName))
  }
}
