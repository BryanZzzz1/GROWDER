import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PagoExitoPage } from './pago-exito.page';

describe('PagoExitoPage', () => {
  let component: PagoExitoPage;
  let fixture: ComponentFixture<PagoExitoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PagoExitoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
