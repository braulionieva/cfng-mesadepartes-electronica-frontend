import { Component, EventEmitter, OnDestroy, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { Delito, Denuncia } from '@shared/interfaces/complaint/complaint-registration';
import { Subscription } from 'rxjs';
import { MaestrosService } from '@shared/services/shared/maestros.service';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { CryptService } from '@shared/services/global/crypt.service';
import { LOCALSTORAGE } from '@environments/environment';
import { ValidarInputDirective } from '@core/directives/validar-input.directive';

const { DENUNCIA_KEY } = LOCALSTORAGE;

@Component({
  selector: 'complaint-scene-details',
  standalone: true,
  imports: [
    FormsModule, ReactiveFormsModule, CommonModule, MessagesModule, RadioButtonModule, InputTextareaModule,
    DropdownModule, DynamicDialogModule, CmpLibModule, ButtonModule, OverlayPanelModule, AlertComponent, ValidarInputDirective
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
  public caracteresMaximo: number = 4000;

  //todoo lo relacionado a la ia
  public delitosAIActivado: boolean = true//constante
  public loadingSuggestions: boolean = false
  public aiSuggestions: any[] = []
  public showAISuggestions: boolean = false
  public showComboDelitos: boolean = false

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

  public lastAISearchReport: string = '';

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
      const sanitizedLength = (value ?? '').length;
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
    const value = this.form.get('report')?.value ?? ''
    return value.length
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

  /*********************/
  /*  AI SUGGESTIONS   */
  /*********************/
  public getAISuggestions(): void {
    const reportValue = this.form.get('report')?.value;
    if (!reportValue || reportValue.trim().length === 0) {
      // Mostrar mensaje de que necesita escribir algo en el textarea
      return;
    }
    this.lastAISearchReport = reportValue.trim();
    this.loadingSuggestions = true;

    const requestData = {
      nivelDelito: "subgenerico",
      hecho: reportValue.trim()
    };

    this.suscriptions.push(
      this.maestrosService.getAISuggestions(requestData).subscribe({
        next: (resp) => {
          this.loadingSuggestions = false;
          if (resp && resp.codigo === 200 && resp.data) {
            // Mapear la respuesta de IA al formato esperado para mostrar como opciones
            this.aiSuggestions = resp.data.map(item => ({
              idDelitoSubgenericoEspecifico: `${item.idDelitoGenerico}/${item.idDelitoSubGenerico}/${item.idDelitoEspecifico || 0}`,
              noDelitoSubgenericoEspecifico: item.noDelitoEspecifico ?
                `${item.noDelitoGenerico} - ${item.noDelitoSubGenerico} - ${item.noDelitoEspecifico}` :
                `${item.noDelitoGenerico} - ${item.noDelitoSubGenerico}`,
              idDelitoGenerico: item.idDelitoGenerico,
              noDelitoGenerico: item.noDelitoGenerico,
              idDelitoSubGenerico: item.idDelitoSubGenerico,
              noDelitoSubGenerico: item.noDelitoSubGenerico,
              idDelitoEspecifico: item.idDelitoEspecifico,
              noDelitoEspecifico: item.noDelitoEspecifico
            }));

            this.showAISuggestions = true;
            if (this.aiSuggestions.length === 0) {
              this.showComboDelitos = true;
            }
          }
        },
        error: (error) => {
          this.loadingSuggestions = false;
          console.error('Error al obtener sugerencias de IA:', error);
          // Aquí podrías mostrar un mensaje de error al usuario
        }
      })
    );
  }

  public selectAISuggestion(suggestion: any): void {
    // Agregar la sugerencia seleccionada a la lista de crímenes si no existe
    const exists = this.crimeList.find(crime =>
      crime.idDelitoSubgenericoEspecifico === suggestion.idDelitoSubgenericoEspecifico
    );

    if (!exists) {
      this.crimeList.unshift(suggestion);
    }

    // Seleccionar la sugerencia en el formulario
    this.form.get('crime')?.setValue(suggestion.idDelitoSubgenericoEspecifico);
    this.form.get('delito')?.setValue(suggestion.noDelitoSubgenericoEspecifico);

    // Ocultar las sugerencias después de seleccionar
    this.showAISuggestions = false;

    this.showComboDelitos = true;
  }

  public closeAISuggestions(): void {
    this.showAISuggestions = false;
  }

  public selectOtherAndListDelitos(): void {

    // Por ahora, oculto las sugerencias y el usuario puede usar el dropdown normal
    this.showAISuggestions = false;

    //mostramos delitos
    this.showComboDelitos = true;
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

  public get isReportChangedSinceAISearch(): boolean {
    const current = this.form.get('report')?.value?.trim() ?? '';
    return current !== this.lastAISearchReport;
  }
}
