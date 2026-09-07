import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistorialComprasPage } from './historial-compras.page';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';
import { ServicebdService } from 'src/app/services/servicesbd.service';
import { AlertController } from '@ionic/angular';  // Asegúrate de importar AlertController

// Mock de AlertController para evitar que se muestren alertas
function mockAlertController() {
  return {
    create: jasmine.createSpy().and.returnValue({
      present: jasmine.createSpy().and.returnValue(Promise.resolve()),  // Evita que se presente la alerta
      dismiss: jasmine.createSpy().and.returnValue(Promise.resolve())   // Evita que se cierre la alerta
    })
  };
}

describe('HistorialComprasPage', () => {
  let component: HistorialComprasPage;
  let fixture: ComponentFixture<HistorialComprasPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HistorialComprasPage],
      providers: [
        ServicebdService,
        SQLite,  // Usamos el proveedor real de SQLite
        { provide: AlertController, useFactory: mockAlertController }  // Mock de AlertController
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HistorialComprasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();  // Detecta los cambios e inicializa el componente
  });

  it('should create', () => {
    expect(component).toBeTruthy();  // Verifica que el componente se haya creado correctamente
  });
});
