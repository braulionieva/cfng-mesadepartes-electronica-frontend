/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { CryptService } from './crypt.service';

describe('Service: Crypt', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CryptService]
    });
  });

  it('should ...', inject([CryptService], (service: CryptService) => {
    expect(service).toBeTruthy();
  }));
});
