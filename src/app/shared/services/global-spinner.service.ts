import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GlobalSpinnerService {
  private showSpinnerSubject = new BehaviorSubject<boolean>(false);

  showSpinner$ = this.showSpinnerSubject.asObservable();

  show() {
    this.showSpinnerSubject.next(true);
  }

  hide() {
    this.showSpinnerSubject.next(false);
  }
}
