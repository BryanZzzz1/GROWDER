import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IniciotiendaPage } from './iniciotienda.page';
import { of } from 'rxjs';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';
import { ServicebdService } from 'src/app/services/servicesbd.service';
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

describe('IniciotiendaPage', () => {
  let component: IniciotiendaPage;
  let fixture: ComponentFixture<IniciotiendaPage>;

  beforeEach(() => {
    // Crear un "spy" para SQLite con el método executeSql
    const sqliteSpy = jasmine.createSpyObj('SQLite', ['executeSql']);
    sqliteSpy.executeSql.and.returnValue(of(true));  // Simula una respuesta exitosa

    TestBed.configureTestingModule({
      declarations: [IniciotiendaPage],
      providers: [
        ServicebdService,
        { provide: SQLite, useValue: sqliteSpy },  // Inyectamos el "spy" de SQLite
        { provide: AlertController, useFactory: mockAlertController }  // Inyectamos el mock de AlertController
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(IniciotiendaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();  // Detecta los cambios e inicializa el componente
  });

  it('should create', () => {
    expect(component).toBeTruthy();  // Verifica que el componente se haya creado correctamente
  });
});
