/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { MesaService } from './mesa.service';

describe('Service: Mesa', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MesaService]
    });
  });

  it('should ...', inject([MesaService], (service: MesaService) => {
    expect(service).toBeTruthy();
  }));
});
