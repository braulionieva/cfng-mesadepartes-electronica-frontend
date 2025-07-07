/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { AppendService } from './append.service';

describe('Service: Append', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppendService]
    });
  });

  it('should ...', inject([AppendService], (service: AppendService) => {
    expect(service).toBeTruthy();
  }));
});

