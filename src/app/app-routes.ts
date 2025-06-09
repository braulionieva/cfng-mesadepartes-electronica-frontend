import { Routes } from '@angular/router';
import { VerificationComponent } from "@shared/components/verification/verification.component";
import { PersonalDataComponent } from "@shared/components/personal-data/personal-data.component";
import { ComplaintDataComponent } from "@modules/complaint/components/complaint-data/complaint-data.component";
import { ConfirmationComponent } from '@modules/complaint/components/confirmation/confirmation.component';
import { DenunciaRegistradaComponent } from '@modules/complaint/components/denuncia-registrada/denuncia-registrada.component';
import { ConsultCaseComponent } from '@modules/tracing/components/consult-case/consult-case.component';
import { CompletedProcessComponent } from '@modules/tracing/components/completed-process/completed-process.component';
import { AppendDocumentComponent } from '@modules/append/components/append-document/append-document.component';
import {
  DocumentPreviewComponent
} from "@modules/append/components/completed-process/document-preview/document-preview.component";
import {
  DocumentRegisteredComponent
} from "@modules/append/components/completed-process/document-registered/document-registered.component";
import { SpecialtyComponent } from '@modules/complaint/components/specialty/specialty.component';
import {VerificationIdPeruComponent} from "@shared/components/verificationIdPeru/verification-id-peru.component";

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./modules/main/main.component').then(m => m.MainComponent)
  },
  {
    path: 'realizar-denuncia',
    loadComponent: () => import('./modules/complaint/complaint.component').then(m => m.ComplaintComponent),
    children: [
      { path: '', redirectTo: 'verificacion', pathMatch: 'full' },
      { path: 'verificacion', component: VerificationComponent },
      { path: 'datos-personales', component: PersonalDataComponent },
      { path: 'datos-especialidad', component: SpecialtyComponent },
      { path: 'datos-denuncia', component: ComplaintDataComponent },
      { path: 'confirmacion', component: ConfirmationComponent, },
      { path: 'denuncia-registrada', component: DenunciaRegistradaComponent }
    ]
  },
  {
    path: 'seguir-denuncia',
    loadComponent: () => import('./modules/tracing/tracing.component').then(m => m.TracingComponent),
    children: [
      { path: '', redirectTo: 'verificacion', pathMatch: 'full' },
      { path: 'verificacion', component: VerificationComponent },
      { path: 'consultar-caso', component: ConsultCaseComponent },
      { path: 'documento-generado', component: CompletedProcessComponent }
    ]
  },
  {
    path: 'presentar-documento',
    loadComponent: () => import('./modules/append/append.component').then(m => m.AppendComponent),
    children: [
      { path: '', redirectTo: 'verificacion', pathMatch: 'full' },
      { path: 'verificacion', component: VerificationComponent },
      { path: 'consultar-caso', component: ConsultCaseComponent },
      { path: 'datos-personales', component: PersonalDataComponent },
      { path: 'datos-documento', component: AppendDocumentComponent },
      { path: 'confirmacion', component: DocumentPreviewComponent },
      //{ path: 'documentos-registrados', component: CompletedProcessComponent },
      { path: 'documentos-registrados', component: DocumentRegisteredComponent },
      { path: 'documento-generado', component: CompletedProcessComponent }
    ]
  },
  {
    path: 'verificacion-id-peru',
    component: VerificationIdPeruComponent
  },
]
