import { Component, inject, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Paso } from '@shared/interfaces/pasos/paso.interface'
import { NavigationEnd, Router } from '@angular/router'
import { filter, Subscription } from 'rxjs'

@Component({
  selector: 'pasos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pasos.component.html',
  styleUrls: ['./pasos.component.scss']
})
export class PasosComponent {

  @Input() pasos: Paso[] = []

  private readonly router = inject(Router)
  protected rutaActual: string = ''
  private routerSub!: Subscription

  ngOnInit(): void {
    this.routerSub = this.router.events
    .pipe(filter(event => event instanceof NavigationEnd))
    .subscribe((event: NavigationEnd) => {
      this.rutaActual = event.urlAfterRedirects.split('/').pop() ?? ''
    })
    this.rutaActual = this.router.url.split('/').pop() ?? ''
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe()
  }
  
  protected esPasoActivo(paso: Paso): boolean {
    return paso.routerLink === this.rutaActual
  }

  protected esPasoCompletado(index: number): boolean {
    const pasoActualIndex = this.pasos.findIndex(p =>
      this.router.url.includes(p.routerLink)
    )
    return index < pasoActualIndex
  }

  protected esUltimoPaso(index: number): boolean {
    return index < this.pasos.length - 1
  }

}