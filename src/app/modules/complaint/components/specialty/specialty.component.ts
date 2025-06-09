import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CancelModalComponent } from '@shared/components/verification/modal/cancel-modal/cancel-modal.component';
import { MaestrosService } from '@shared/services/shared/maestros.service';
import { obtenerIcono } from '@shared/utils/icon';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { CmpLibModule } from 'ngx-mpfn-dev-cmp-lib';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { MessagesModule } from 'primeng/messages';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ProgressBarModule } from 'primeng/progressbar';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-specialty',
  standalone: true,
  imports: [
    CommonModule, MessagesModule, ButtonModule, ProgressBarModule, PdfViewerModule,
    DynamicDialogModule, CmpLibModule, ToastModule, ReactiveFormsModule,
    ReactiveFormsModule, RadioButtonModule, OverlayPanelModule,
  ],
  templateUrl: './specialty.component.html',
  styleUrls: ['./specialty.component.scss'],
  providers: [MessageService, DialogService],

})
export class SpecialtyComponent {
  private readonly _fb = inject(FormBuilder);
  private readonly _router = inject(Router);
  private readonly _dialogService = inject(DialogService);
  private readonly _maestrosService = inject(MaestrosService);

  protected obtenerIcono = obtenerIcono;

  protected form: FormGroup = this._fb.group({
    tipoDelitoSeleccionado: new FormControl({ value: '001', disabled: false }, [
      Validators.required
    ]),
  });

  protected tiposDelito = [
    {
      "id": "001",
      "titulo": "Común",
      "descripcion": "Si el delito tiene relación con robo, hurto, estafa usurpación, apropiación ilícita y otros.",
      "otrosDelitos": [
        "Homicidio",
        "Aborto",
        "Lesiones",
        "Exposición a peligro o abandono de personas en peligro",
        "Abigeato",
        "Receptación",
        "Estafa y otras defraudaciones",
        "Fraude en la administración de personas jurídicas",
        "Extorsión",
        "Daños",
        "Disposición común"
      ]
    },
    // {
    //   "id": "003",
    //   "titulo": "Violencia Contra la Mujer y los Integrantes del Grupo Familiar",
    //   "descripcion": "Si el delito tiene relación con violación sexual, actos contra el pudor, violencia contra la mujer, acoso sexual, lesiones y otros.",
    //   "otrosDelitos": [
    //     "Violación sexual",
    //     "Violación sexual de menor de edad",
    //     "Violación sexual mediante engaño",
    //     "Violación de persona bajo autoridad o vigilancia",
    //     "Violación de persona en estado de inconsciencia o en la imposibilidad de resistir",
    //     "Violación de persona en incapacidad de dar su libre consentimiento",
    //     "Tocamientos",
    //     "Actos de connotación sexual o actos libidinosos en agravio de menores",
    //     "Acoso sexual",
    //     "Chantaje sexual",
    //     "Difusión de imágenes",
    //     "Materiales audiovisuales o audios con contenido sexual",
    //     "Proposiciones a niños, niñas y adolescentes con fines sexuales",
    //     "Explotación sexual",
    //     "Explotación sexual comercial infantil y adolescente en ámbito del turismo",
    //     "Feminicidio",
    //     "Lesiones culposas",
    //     "Lesiones graves",
    //     "Agresiones en contra de las mujeres",
    //     "Integrantes del grupo familiar"
    //   ]
    // },
    // {
    //   "id": "004",
    //   "titulo": "Materia Ambiental",
    //   "descripcion": "Delitos como contaminación, residuos sólidos, tráfico ilegal de residuos peligrosos y otros.",
    //   "otrosDelitos": [
    //     "Minería ilegal agravada"
    //   ]
    // },
    // {
    //   "id": "005",
    //   "titulo": "Trata de Personas",
    //   "descripcion": "Delitos como trata de personal, trata de personas agravada, explotación sexual y otros.",
    //   "otrosDelitos": [
    //     "Promoción o favorecimiento de la explotación sexual",
    //     "Cliente de explotación sexual",
    //     "Beneficio por explotación sexual",
    //     "Gestión de la explotación sexual",
    //     "Explotación sexual de niños, niñas y adolescentes",
    //     "Promoción y favorecimiento de la explotación sexual de niñas, niños y adolescentes (Artículo 129 - I)",
    //     "Cliente del adolescente",
    //     "Beneficio de la explotación sexual de niñas, niños y adolescentes",
    //     "Gestión de la explotación sexual de niñas, niños y adolescentes",
    //     "Pornografía infantil",
    //     "Publicaciones en los medios de comunicación sobre delitos de la libertad sexual contra niños, niñas y adolescentes",
    //     "Esclavitud y otras formas de explotación",
    //     "Trabajo forzoso",
    //     "Favorecimiento a la prostitución",
    //     "Rufianismo",
    //     "Proxenetismo",
    //     "Exhibiciones y publicaciones obscenas",
    //     "Proposiciones a niños, niñas y adolescentes con fines sexuales",
    //     "Tráfico de migrantes y formas agravadas"
    //   ]
    // },
    // {
    //   "id": "006",
    //   "titulo": "Delitos Aduaneros y Propiedad Intelectual",
    //   "descripcion": "Delitos de copia o reproducción no autorizada, difusión, distribución y circulación de obras sin autorización del autor y otros.",
    //   "otrosDelitos": [
    //     "Formas agravadas",
    //     "Plagio",
    //     "Elusión de medida tecnológica efectiva",
    //     "Productos destinados a la elusión de medidas tecnológicas",
    //     "Servicios destinados a la elusión de medidas tecnológicas",
    //     "Delitos contra la información sobre gestión de derechos",
    //     "Etiquetas, carátulas o empaques",
    //     "Manuales, licencias u otra documentación, o empaques no auténticos relacionados a programas de ordenador",
    //     "Incautación preventiva y comiso definitivo",
    //     "Fabricación o uso no autorizado de patente",
    //     "Penalización de la clonación o adulteración de terminales de telecomunicaciones",
    //     "Uso o venta no autorizada de diseño o modelo industrial",
    //     "Condición y grado de participación del agente"
    //   ]
    // },
    // {
    //   "id": "007",
    //   "titulo": "Delito Tributario",
    //   "descripcion": "Delitos como elaboración clandestina de productos y comercio clandestino y otros.",
    //   "otrosDelitos": [
    //     "Defraudación tributaria por falta de pago parcial o total de los tributos de ley",
    //     "Delito contable por incumplimiento de normas tributarias",
    //     "Delito tributario por brindar información falsa en el RUC",
    //     "Delito tributario por almacenar bienes no declarados",
    //     "Delito tributario por facilitar comprobantes de pago"
    //   ]
    // },
    // {
    //   "id": "008",
    //   "titulo": "Ciberdelincuencia",
    //   "descripcion": "Delitos como acceso ilícito, atentado a la integridad de datos informáticos y otros.",
    //   "otrosDelitos": [
    //     "Atentado a la integridad de sistemas informáticos",
    //     "Proposiciones a niños, niñas y adolescentes con fines sexuales por medios tecnológicos",
    //     "Interceptación de datos informáticos",
    //     "Fraude informático",
    //     "Suplantación de identidad",
    //     "Abuso de mecanismos y dispositivos informáticos",
    //     "Estafa agravada para sustraer o acceder a datos de tarjeta de ahorros o crédito"
    //   ]
    // }
  ];

  protected seleccionarDelito(valor: string): void {
    this.form.get('tipoDelitoSeleccionado')?.setValue(valor);
  }

  protected generarTooltipHTML(delitos: string[]): string {
    if (!delitos?.length)
      return '';

    const lista = delitos
      .map(d => `<li class="mb-1">${d}</li>`)
      .join('');

    return `<div class="delitos-tooltip">
              <strong>Otros delitos:</strong>
              <ul class="m-0 pl-4 mt-2">${lista}</ul>
            </div>`;
  }

  protected askToCancelComplaint(): void {
    this._dialogService.open(CancelModalComponent, {
      showHeader: false,
      contentStyle: {
        'max-width': '670px',
        'padding': '0px'
      },
    });
  }

  protected backPersonalData(): void {
    this._router.navigate(['realizar-denuncia/datos-personales']);
  }


  protected nextStep(): void {
    this._router.navigate(['realizar-denuncia/datos-denuncia']);
  }

  protected mostrarDelitos(event: Event, overlayPanel: any): void {
    event.stopPropagation();
    overlayPanel.toggle(event);
  }
}
