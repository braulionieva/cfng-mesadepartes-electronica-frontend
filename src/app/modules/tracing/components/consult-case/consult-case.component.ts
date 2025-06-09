import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, Validators, FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';

//primeng
import { MessagesModule } from "primeng/messages";

import { ButtonModule } from "primeng/button";
import { DividerModule } from 'primeng/divider';
import { DropdownModule } from "primeng/dropdown";
import { InputTextareaModule } from 'primeng/inputtextarea';

//mpfn
import { CmpLibModule, onlyNumbers } from "ngx-mpfn-dev-cmp-lib";
import { obtenerIcono } from '@shared/utils/icon';
//utils

import { Router } from '@angular/router';
import { MsCasoService } from '@shared/services/shared/msCaso.service';

import { formatDate, formatDateString, noQuotes } from '@shared/utils/utils';
import { AUTOCOMPLETE, LOCALSTORAGE } from '@environments/environment';
import { TracingService } from '@modules/tracing/tracing.service';

import { StepsModule } from 'primeng/steps';

import { TokenService } from '@shared/services/auth/token.service';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CryptService } from '@shared/services/global/crypt.service';

import { ConfirmCaseFoundModal } from '@modules/append/components/completed-process/confirm-case-found.component';
import { ProfileType } from '@shared/helpers/dataType';
import { SLUG_CONFIRM_RESPONSE, SLUG_DOCUMENT_TYPE, SLUG_PROFILE } from '@shared/helpers/slugs';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { MaestrosService } from '@shared/services/shared/maestros.service';
import { StorageService } from '@shared/services/storage.service';
import { ValidarInputDirective } from '@core/directives/validar-input.directive';


const { VALIDATE_KEY } = LOCALSTORAGE;
@Component({
  selector: 'app-consult-case',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, MessagesModule, ButtonModule, DividerModule,
    DropdownModule, StepsModule, InputTextareaModule, DynamicDialogModule, CmpLibModule, AlertComponent, ValidarInputDirective
  ],
  templateUrl: './consult-case.component.html',
  providers: [DialogService]
})
export class ConsultCaseComponent implements OnInit {

  //stepEtapa: MenuItem[] | undefined;
  /*IDCASO
  TIPOPARTE
  istracking
  */
  TYPELAWYER = 3;
  public obtenerIcono = obtenerIcono;
  public anexoCount: any = 0;
  public observationsCount: any = 0;
  activeIndex: number = 0;
  public stepEtapa = [
    {
      label: 'Preliminar',
      routerLink: 'preliminar',
      styleClass: '',

    },
    {
      label: 'Preparatoria',
      routerLink: 'preparatoria',
      styleClass: '',
    },
    {
      label: 'Intermedia',
      routerLink: 'intermedia',
      styleClass: '',
    },
    {
      label: 'Juzgamiento',
      routerLink: 'juzgamiento',
      styleClass: '',
    },
    {
      label: 'Ejecución de Sentencia',
      routerLink: 'ejecucion',
      styleClass: '',
    }
  ];
  ngOnInit(): void {
    //this.fetchDocumentType()

    this.clearSearcherCase()


  }

  public numberCaseForm: FormGroup;

  public messages = [
    {
      severity: 'warn',
      detail: 'Recuerde que para realizar el seguimiento del caso o anexar un documento a un caso existente, usted debe tener un número de caso el cual fue asociado a su denuncia.'
    }
  ];

  public messagesMain = [
    {
      severity: 'warn',
      detail: 'Si usted desea presentar una denuncia, puede hacerlo ahora.'
    }
  ];

  public attachDocuments = false;
  public noQuotes = noQuotes
  public numeroDni
  public searchCase = {
    data: null,
    loading: false
  }
  /*0
    public identificacionDocumento = {
      id: null,
      token: null
    }
  */
  public searchCaseError: boolean = false

  public searchCaseArchived: boolean = false

  public searchSujetoCaseError: boolean = false

  public tmpProfile: ProfileType = SLUG_PROFILE.CITIZEN
  public attachmentsForm: FormGroup;

  public documentTypes = []
  public previousFiles = []

  public listaEtapa = []
  public refModal: DynamicDialogRef;
  //identificar : IdentificacionDocumento;
  validaToken;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly msCasoService: MsCasoService,
    private readonly tracingService: TracingService,
    private readonly maestrosService: MaestrosService,
    private readonly tokenService: TokenService,
    private readonly dialogService: DialogService,
    private readonly storageService: StorageService,
    private readonly cryptService: CryptService
  ) {

    //this.clearSearcherCase()

    let valida = localStorage.getItem(LOCALSTORAGE.VALIDATE_KEY);
    this.validaToken = JSON.parse(this.cryptService.decrypt(valida));
    this.getEtapa(1, '01')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (sessionStorage.getItem('currentCase')) {
      this.searchCase.data = JSON.parse(sessionStorage.getItem('currentCase'))
    }

    this.numberCaseForm = fb.group({
      dependence: [
        this.searchCase.data?.codigoCaso.split('-')[0],
        [Validators.required, Validators.pattern(onlyNumbers)]
      ],
      year: [
        this.searchCase.data?.codigoCaso.split('-')[1],
        [Validators.required, Validators.pattern(onlyNumbers)]
      ],
      counter: [
        this.searchCase.data?.codigoCaso.split('-')[2],
        [Validators.required, Validators.pattern(onlyNumbers)]
      ],
      number: [
        this.searchCase.data?.codigoCaso.split('-')[4] ?? '0',
        [Validators.required, Validators.pattern(onlyNumbers)]
      ],
    })

    if (AUTOCOMPLETE) {
      this.numberCaseForm.get('dependence').setValue('506084501');
      this.numberCaseForm.get('year').setValue('2023');
      this.numberCaseForm.get('counter').setValue('35');
    }
  }
  public actualizaStep(tipo: number, proceso: string) {

    this.getEtapa(tipo, proceso)
    this.stepEtapa = []
    this.listaEtapa.forEach(p => {
      this.stepEtapa.push({
        label: p.nombre,
        routerLink: p.id,
        styleClass: 'py-3',
      })
    });

  }
  public getEtapa(tipo: number, proceso: string): void {
    this.maestrosService.getEtapa(tipo, proceso).subscribe({
      next: (resp) => {
        if (resp && resp.code === 200) {
          this.listaEtapa = resp.data;

        }
      },
    });
  }

  get case() {
    return this.searchCase.data ?? {}
  }

  get caseNumber(): string {
    const { dependence, year, counter, number } = this.numberCaseForm.value
    return `${dependence}-${year}-${counter}-${number}`
  }

  public nextStep(): void {
    this.tracingService.saveAttachmentForm(this.attachmentsForm.value)
    this.router.navigate(['seguir-denuncia/confirmacion'])
  }

  public nextStepAppend(): void {
    this.tracingService.saveAttachmentForm(this.attachmentsForm.value)
    this.router.navigate(['presentar-documento/consultar-caso/presentar-documento'])
  }

  public generatePDF(): void {

    const validateToken = JSON.parse(this.tokenService.getItem(VALIDATE_KEY))

    let newValidateToken = {
      ...validateToken,
      case: this.searchCase.data,
    }

    this.tokenService.saveItem(VALIDATE_KEY, JSON.stringify(newValidateToken))

    this.router.navigate(['seguir-denuncia/documento-generado'])
  }

  public consultCase(): void {

    const validateToken = JSON.parse(this.tokenService.getItem(VALIDATE_KEY))

    this.numeroDni = validateToken.validateIdentity.numeroDni

    this.searchCaseArchived = false
    this.searchCaseError = false
    this.searchSujetoCaseError = false

    this.searchCase.loading = true

    this.msCasoService.consultCase(this.caseNumber, SLUG_DOCUMENT_TYPE.DNI, this.numeroDni).subscribe({
      next: resp => {
        this.searchCase.loading = false

        if (resp.concluido == 1) {
          this.searchCaseArchived = true
          return;
        }

        if ((resp.tipoParteSujeto != null) || (resp.tipoParteSujeto != '') || (resp.tipoVinculo == this.TYPELAWYER)) {
          this.confirmAppend(resp)

        }

      }, error: (error) => {//mostrar mensaje
        if (error.error.code === "42202005")
          this.searchSujetoCaseError = true
        else
          this.searchCaseError = true

        this.searchCase.loading = false;
      }
    })

  }

  get isTrackingProcess(): boolean {
    return this.router.url.includes('seguir-denuncia/consultar-caso')
  }

  public formatDate(date: string): string {
    if (!date) return '-'
    return formatDate(new Date(date))
  }

  public formatDateString(date: string): string {
    if (!date) return '-'
    return formatDateString(date)
  }

  onActiveIndexChange(ev) {
    for (let i = 0; i < this.stepEtapa.length; i++) {
      this.stepEtapa[i].styleClass = this.getStepEtapaClass(i + 1);
    }
  }

  private getStepEtapaClass(step: number): string {
    if (step < this.activeIndex)
      return 'py-3 fn-step-completed'
    else if (step === this.activeIndex)
      return 'py-3 fn-step-highlight'
    else
      return 'py-3'
  }

  cancelTracking() {

    if (this.storageService.existItem(LOCALSTORAGE.VALIDATE_KEY)) {
      this.storageService.clearItem(LOCALSTORAGE.VALIDATE_KEY)

    }
    if (this.isTrackingProcess) {
      this.router.navigate(['seguir-denuncia/verificacion'])
    }
    else {
      this.router.navigate(['presentar-documento/verificacion'])
    }
  }

  confirmAppend(resp: any) {

    this.refModal = this.dialogService.open(ConfirmCaseFoundModal, {
      showHeader: false,
      contentStyle: { 'max-width': '650px', 'padding': '0' },
      data: { name: '', tipoParte: resp.tipoParteSujeto, codigoCaso: resp.codigoCaso, istracking: this.isTrackingProcess, isLawyer: resp.tipoVinculo }

    })
    this.refModal.onClose.subscribe((confirm) => {
      if (confirm === SLUG_CONFIRM_RESPONSE.OK) {
        this.searchCase.data = resp

        this.actualizaStep(1, '01')
        this.activeIndex = this.searchCase.data.idEtapa;
        this.onActiveIndexChange(this.activeIndex);

        this.tracingService.saveCaseFound(this.searchCase.data)
        const validateToken = JSON.parse(this.tokenService.getItem(VALIDATE_KEY))
        let newValidateToken = {
          ...validateToken,
          case: this.searchCase.data,
        }
        this.tokenService.saveItem(VALIDATE_KEY, JSON.stringify(newValidateToken))

        if (!this.isTrackingProcess)
          this.router.navigate(['presentar-documento/datos-personales'])

      }
      else {
        this.searchCase.data = null
        this.searchCase.loading = false
      }
    })
  }

  clearSearcherCase() {
    this.searchCaseError = false;
    this.searchSujetoCaseError = false;
    this.searchCaseArchived = false;

    this.numberCaseForm.reset();
    this.numberCaseForm.get('number').setValue('0');
    this.searchCase.data = null
    this.tracingService.clearTracingStorage();
  }

  goMain() {
    this.router.navigate(['/'])
  }
}
