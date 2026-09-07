import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResumenVentasPage } from './resumen-ventas.page';
import { ServicebdService } from 'src/app/services/servicesbd.service';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';
import { AlertController } from '@ionic/angular';

// Mock de AlertController para evitar que se muestren alertas
function mockAlertController() {
  return {
    create: jasmine.createSpy().and.returnValue({
      present: jasmine.createSpy().and.returnValue(Promise.resolve()),  // Evita que se presente la alerta
      dismiss: jasmine.createSpy().and.returnValue(Promise.resolve())   // Evita que se cierre la alerta
    })
  };
}

describe('ResumenVentasPage', () => {
  let component: ResumenVentasPage;
  let fixture: ComponentFixture<ResumenVentasPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ResumenVentasPage],
      providers: [
        ServicebdService,
        { provide: SQLite, useValue: {} }, // Mock de SQLite (si es necesario)
        { provide: AlertController, useFactory: mockAlertController } // Mock de AlertController
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResumenVentasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();  // Verifica que el componente se haya creado correctamente
  });
});
