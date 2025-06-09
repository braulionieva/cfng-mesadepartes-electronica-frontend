import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-global-spinner',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule],
  template: `
    <div *ngIf="show" class="global-spinner-overlay">
      <div class="global-spinner-container">
        <p-progressSpinner
          [style]="{width: '50px', height: '50px'}"
          strokeWidth="8"
          animationDuration=".5s"
          fill="transparent"
          styleClass="blue-spinner">
        </p-progressSpinner>
      </div>
    </div>
  `,
  styles: [`
    .global-spinner-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.4);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }

    .global-spinner-container {
      background-color: transparent;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    ::ng-deep .blue-spinner svg circle {
      stroke: #2196f3 !important;
    }
  `]
})
export class GlobalSpinnerComponent {
  @Input() show: boolean = false;
  @Input() message: string = '';
}
