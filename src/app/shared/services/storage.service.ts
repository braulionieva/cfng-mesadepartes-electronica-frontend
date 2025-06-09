import { Injectable } from '@angular/core';
import { SYSTEM_NAME } from '@environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  get() {
    const _system = localStorage.getItem(SYSTEM_NAME);
    if (_system === null) return;
    const _systemParsed = JSON.parse(_system);
    return _systemParsed;
  }

  getItem(itemName: string) {
    const _system = localStorage.getItem(SYSTEM_NAME);
    if (_system === null) return;
    const _systemParsed = JSON.parse(_system);
    return _systemParsed[itemName];
  }

  createItem(itemName: string, itemValue: string) {
    const _system = this.get();
    const _systemUpdated = { ..._system, [itemName]: itemValue };
    localStorage.setItem(SYSTEM_NAME, JSON.stringify(_systemUpdated));
  }

  clearItem(itemName: string) {
    const _system = this.get();
    delete _system[itemName];
    localStorage.setItem(SYSTEM_NAME, JSON.stringify(_system));
  }

  exist() {
    return !!localStorage.getItem(SYSTEM_NAME);
  }

  existItem(itemName: string) {
    return this.exist() ? !!this.getItem(itemName) : false;
  }
}
