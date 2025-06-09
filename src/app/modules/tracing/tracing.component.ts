import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

//primeng
import { ButtonModule } from "primeng/button";
import { StepsModule } from 'primeng/steps';
import { MessagesModule } from "primeng/messages";
import { NavigationEnd, Router } from '@angular/router';
//mpfn
import { CmpLibModule } from "ngx-mpfn-dev-cmp-lib";
@Component({
  selector: 'app-tracing',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    StepsModule,
    MessagesModule,
    CmpLibModule
  ],
  templateUrl: './tracing.component.html',
  styles: [
  ]
})
export class TracingComponent {
  public steps = [
    {
      label: 'Identificación',
      routerLink: 'verificacion',
      styleClass: '',
    },
    {
      label: 'Consultar caso',
      routerLink: 'consultar-caso',
      styleClass: '',
    },
  ]

  constructor(private readonly router: Router) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.steps[0].styleClass = this.getStepClass(1);
        this.steps[1].styleClass = this.getStepClass(2);
      }
    })
  }

  get isCompletedProcess(): boolean {
    return [
      'confirmacion',
      'documentos-registrados',
      'documento-generado'
    ].some(subpath => this.router.url.includes(subpath))
  }

  get isValidationStage(): boolean {
    return [

      'verificacion'//,'datos-personales'

    ].some(subpath => this.router.url.includes(subpath))
  }

  get pageTitle(): string {
    return 'Seguimiento del Caso'
  }

  get currentStep(): number {
    const path = this.router.url.split('/').pop()


    return [
      'verificacion',//  'datos-personales',

      'consultar-caso'
    ].findIndex(i => path === i) + 1
  }

  private getStepClass(step: number): string {
    if (step < this.currentStep)
      return 'py-3 fn-step-completed'
    else if (step === this.currentStep)
      return 'py-3 fn-step-highlight'
    else
      return 'py-3'
  }

}
