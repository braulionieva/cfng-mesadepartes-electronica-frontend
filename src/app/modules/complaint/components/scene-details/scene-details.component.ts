import { Component, EventEmitter, OnDestroy, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule, AbstractControl } from '@angular/forms';
//primeng
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MessagesModule } from "primeng/messages";
import { DropdownModule } from 'primeng/dropdown';
import { DialogService, DynamicDialogRef, DynamicDialogModule } from "primeng/dynamicdialog";
import { ButtonModule } from "primeng/button";
import { OverlayPanelModule } from 'primeng/overlaypanel';

//mpfn
import { CmpLibModule, ctrlErrorMsg } from "ngx-mpfn-dev-cmp-lib";
import { noQuotes } from '@shared/utils/utils';

//components
import { SpecializedModalComponent } from "../specialized-modal/specialized-modal.component";
import { Delito, Denuncia } from '@shared/interfaces/complaint/complaint-registration';
import { Subscription } from 'rxjs';
import { MaestrosService } from '@shared/services/shared/maestros.service';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { CryptService } from '@shared/services/global/crypt.service';
import { LOCALSTORAGE } from '@environments/environment';

const { DENUNCIA_KEY } = LOCALSTORAGE;

@Component({
  selector: 'complaint-scene-details',
  standalone: true,
  imports: [
    FormsModule, ReactiveFormsModule, CommonModule, MessagesModule, RadioButtonModule, InputTextareaModule,
    DropdownModule, DynamicDialogModule, CmpLibModule, ButtonModule, OverlayPanelModule, AlertComponent
  ],
  templateUrl: './scene-details.component.html',
  styleUrls: ['./scene-details.component.scss'],
  providers: [DialogService],
  styles: [`
    :host ::ng-deep .p-dropdown-item.p-ripple {
      white-space: normal;
    }
  `]
})
export class SceneDetailsComponent implements OnInit, OnDestroy {

  @Input() recoveredData: Delito | null = null
  @Output() formChanged = new EventEmitter<Object>();

  /***************/
  /*  VARIABLES  */
  /***************/
  public data: Denuncia = null;
  public specialtyData: any = null;
  public validaToken

  public crimeList = []
  public errorcrime: string = 'Debe seleccionar un delito.'

  public specialtyList = []
  public specialtyMessage = []
  public errorspecialty: string = 'Debe seleccionar una especialidad.'

  public refModal: DynamicDialogRef

  public loadingData: boolean = false
  public formInitialized: boolean = false
  public mostrarErrorReport: boolean = false
  public suscriptions: Subscription[] = [];
  public caracteresMaximo : number = 4000;

  public messages = [
    {
      severity: 'warn',
      isVerification: false,
      detail: 'El delito que seleccione es netamente referencial. La fiscalía se encargará de tipificar con precisión el delito, basándose en los hechos descritos.'
    },
    {
      severity: 'error',
      isVerification: false,
      custom: true,
      detail: 'El texto debe tener entre 100 y 4000 caracteres'
    }
  ]

  /**********/
  /*  FORM  */
  /**********/

  public form: FormGroup = new FormGroup({})
  public noQuotes = noQuotes;

  /*****************/
  /*  CONSTRUCTOR  */
  /*****************/

  constructor(
    public readonly dialogService: DialogService,
    public readonly maestrosService: MaestrosService,
    private readonly cryptService: CryptService,
  ) { }

  /****************/
  /*  LIFE CYCLE  */
  /****************/

  ngOnInit(): void {
    this.getSpecialty();
    this.getCrimes();

    this.buildForm();

    this.form.get('report')?.valueChanges.subscribe(value => {
      const sanitizedLength = (value || '').replace(/\s/g, '').length;
      this.mostrarErrorReport = sanitizedLength > 0 && sanitizedLength < 100;
    });

    this.specialtyMessage = [{ severity: 'warn', detail: 'El delito que seleccione es meramente referencial. La fiscalía se encargará de tipificar con presición el delito, basándose en los hechos descritos.' }]
  }

  ngOnDestroy() {
    this.suscriptions.forEach(s => s.unsubscribe())

    if (this.refModal)
      this.refModal.close()
  }

  buildForm() {
    if (localStorage.getItem(DENUNCIA_KEY)) {
      let valida = localStorage.getItem(LOCALSTORAGE.DENUNCIA_KEY);
      this.validaToken = JSON.parse(this.cryptService.decrypt(valida));

      this.form = new FormGroup({
        report: new FormControl(this.validaToken.delito.hecho, [Validators.required]),
        specialty: new FormControl(this.validaToken.delito.idEspecialidad, [Validators.required]),
        especialidad: new FormControl(this.validaToken.delito.especialidad),
        delito: new FormControl(this.validaToken.delito.delito),
        crime: new FormControl(this.validaToken.delito.idDelito + '/' + this.validaToken.delito.idDelitoSubgenerico + '/' + this.validaToken.delito.idDelitoEspecifico, [Validators.required]),
      })

      this.setSpecialty(this.validaToken.delito.idEspecialidad)
      this.setCrime(this.validaToken.delito.idDelito + '/' + this.validaToken.delito.idDelitoSubgenerico + '/' + this.validaToken.delito.idDelitoEspecifico)

      this.loadingData = false

      this.saveInfo()
    }

    else {
      this.form = new FormGroup({
        report: new FormControl('', [Validators.required]),
        specialty: new FormControl('', [Validators.required]),
        crime: new FormControl(''),//, [Validators.required]),
        especialidad: new FormControl(''),
        delito: new FormControl(''),
      })
    }

    this.form.valueChanges.subscribe(() => {

      this.saveInfo()
    })
  }

  public setSpecialty(idEspecialidad: number) {
    if (idEspecialidad !== null)
      this.form.controls['specialty'].setValue(idEspecialidad);
  }

  public setCrime(delito: string) {
    if (delito !== null)
      this.form.controls['crime'].setValue(delito);
  }

  /*****************/
  /*  GET METHODS  */
  /*****************/

  get counterReportChar(): number {
    const value = this.form.get('report')?.value || '';
    return value.replace(/\s/g, '').length;
  }

  protected onReportInput(event: Event): void {

    const textarea = event.target as HTMLTextAreaElement;
    const textoOriginal = textarea.value;

    const LIMITE = 4000;
    const cantidadNoBlancos = textoOriginal.replace(/\s/g, '').length;

    if (cantidadNoBlancos <= LIMITE) {
      this.form.get('report')?.setValue(textoOriginal, { emitEvent: false });
      return;
    }

    let exceso = cantidadNoBlancos - LIMITE;
    const caracteres = Array.from(textoOriginal);

    for (let i = caracteres.length - 1; i >= 0 && exceso > 0; i--) {
      if (!/\s/.test(caracteres[i])) {
        caracteres.splice(i, 1);
        exceso--;
      }
    }

    const textoRecortado = caracteres.join('');
    textarea.value = textoRecortado;

    this.form.get('report')?.setValue(textoRecortado.trim(), { emitEvent: false });
}

protected onReportPaste(event: ClipboardEvent): void {

  event.preventDefault();

  const clipboardData = event.clipboardData;
  if (!clipboardData) return;

  const textoPegado = clipboardData.getData('text');
  const control = this.form.get('report');
  if (!control) return;

  const textoActual = control.value || '';
  const LIMITE = 4000;

  const noBlancosActual = textoActual.replace(/\s/g, '').length;

  const espacioDisponible = LIMITE - noBlancosActual;

  if (espacioDisponible <= 0) {
    return;
  }

  let exceso = textoPegado.replace(/\s/g, '').length - espacioDisponible;
  if (exceso <= 0) {
    this.insertarTextoEnCursor(textoPegado, control);
    return;
  }

  const caracteres = Array.from(textoPegado);
  for (let i = caracteres.length - 1; i >= 0 && exceso > 0; i--) {
    if (!/\s/.test(caracteres[i])) {
      caracteres.splice(i, 1);
      exceso--;
    }
  }
  const textoRecortado = caracteres.join('');
  this.insertarTextoEnCursor(textoRecortado.trim(), control);
}

private insertarTextoEnCursor(texto: string, control: AbstractControl): void {
  const textarea = document.querySelector('textarea[formControlName="report"]') as HTMLTextAreaElement;
  if (!textarea) return;

  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const valorActual = control.value ?? '';

  const nuevoValor = valorActual.substring(0, start) + texto + valorActual.substring(end);
  textarea.value = nuevoValor;
  control.setValue(nuevoValor.trim(), { emitEvent: false });

  // Ajustamos cursor para que quede después del texto insertado
  const nuevaPos = start + texto.length;
  textarea.selectionStart = textarea.selectionEnd = nuevaPos;
}


  /*********************/
  /*  GET SPECIALTIES  */
  /*********************/

  public getSpecialty(): void {
    this.suscriptions.push(
      this.maestrosService.getSpecialty().subscribe({
        next: resp => {
          if (resp && resp.code === 200) {
            this.specialtyList = resp.data
            this.specialtyList.sort((x, y) => x.nombre.localeCompare(y.nombre));

            this.specialtyList = this.specialtyList.filter(x => x.codigo === '001');

            const esp = this.form.get('specialty');

            esp.setValue(this.specialtyList[0]?.codigo);
            esp.disable();
          }
        }
      })
    )
  }

  /****************/
  /*  GET CRIMES  */
  /****************/
  protected totalItem: number = 50
  protected perPage: number = 50
  protected page: number = 0

  public getCrimes(): void {
    this.suscriptions.push(
      this.maestrosService.getCrimes().subscribe({
        next: resp => {
          if (resp && resp.code === 200) {
            this.crimeList = this.crimeList.concat(resp.data)
            this.crimeList.sort((x, y) => x.noDelitoSubgenericoEspecifico.localeCompare(y.noDelitoSubgenericoEspecifico));
          }
        }
      })
    )
  }

  /***************/
  /*  SAVE INFO  */
  /***************/

  public saveInfo() {
    if (!this.loadingData) {
      const data = this.form.getRawValue()

      if (data.crime !== '' && data.specialty !== '') {
        const splitted = data.crime.split("/", 3);

        const delito = {
          hecho: data.report,
          idEspecialidad: data.specialty,
          especialidad: data.especialidad,
          delito: data.delito,
          idDelito: splitted[0],
          idDelitoSubgenerico: splitted[1],
          idDelitoEspecifico: splitted[2],
        }

        this.formChanged.emit({ delito });
      }
    }
  }


  protected cambiarEspecialidad(event: any) {
    const seleccionEspecialidad = this.specialtyList.find(x => x.codigo === event.value);
    this.form.get('especialidad')?.setValue(seleccionEspecialidad?.nombre);
  }

  protected cambiarDelito(event: any) {
    const seleccionDelitos = this.crimeList.find(x => x.idDelitoSubgenericoEspecifico === event.value);
    this.form.get('delito')?.setValue(seleccionDelitos?.noDelitoSubgenericoEspecifico);
  }

  /************/
  /*  OTHERS  */
  /************/
  public errorMsg(ctrlName) {
    return ctrlErrorMsg(this.form.get(ctrlName))
  }
}
