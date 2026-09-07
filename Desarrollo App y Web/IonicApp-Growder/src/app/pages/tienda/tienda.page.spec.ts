import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TiendaPage } from './tienda.page';
import { ServicebdService } from 'src/app/services/servicesbd.service';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';
import { of } from 'rxjs';
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

describe('TiendaPage', () => {
  let component: TiendaPage;
  let fixture: ComponentFixture<TiendaPage>;

  beforeEach(() => {
    // Crear un "spy" para SQLite con el método executeSql
    const sqliteSpy = jasmine.createSpyObj('SQLite', ['executeSql']);
    sqliteSpy.executeSql.and.returnValue(of(true));  // Simula una respuesta exitosa para executeSql

    TestBed.configureTestingModule({
      declarations: [TiendaPage],
      providers: [
        ServicebdService,
        { provide: SQLite, useValue: sqliteSpy },  // Usamos el "spy" de SQLite
        { provide: AlertController, useFactory: mockAlertController }  // Mock de AlertController
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TiendaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();  // Detecta los cambios, inicializa el componente
  });

  it('should create', () => {
    expect(component).toBeTruthy();  // Verifica que el componente se crea correctamente
  });
});
