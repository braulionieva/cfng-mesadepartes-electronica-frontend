/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { MaestrosService } from './maestros.service';

describe('Service: Maestros', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MaestrosService]
    });
  });

  it('should ...', inject([MaestrosService], (service: MaestrosService) => {
    expect(service).toBeTruthy();
  }));
});
