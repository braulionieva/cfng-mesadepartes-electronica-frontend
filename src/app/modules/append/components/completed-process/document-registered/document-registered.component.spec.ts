import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentRegisteredComponent } from './document-registered.component';

describe('DocumentRegisteredComponent', () => {
  let component: DocumentRegisteredComponent;
  let fixture: ComponentFixture<DocumentRegisteredComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DocumentRegisteredComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentRegisteredComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
