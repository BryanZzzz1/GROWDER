import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditUserPage } from './edit-user.page';
import { ActivatedRoute } from '@angular/router';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';
import { ServicebdService } from 'src/app/services/servicesbd.service';
import { of } from 'rxjs';  // Para crear un observable para ActivatedRoute
import { AlertController } from '@ionic/angular'; // Importa AlertController

// Mock de AlertController para evitar que se muestren alertas
function mockAlertController() {
  return {
    create: jasmine.createSpy().and.returnValue({
      present: jasmine.createSpy().and.returnValue(Promise.resolve()),  // Evita que se presente la alerta
      dismiss: jasmine.createSpy().and.returnValue(Promise.resolve())   // Evita que se cierre la alerta
    })
  };
}

describe('EditUserPage', () => {
  let component: EditUserPage;
  let fixture: ComponentFixture<EditUserPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditUserPage],
      providers: [
        ServicebdService,  // Usamos el servicio real
        SQLite,            // Usamos el proveedor real de SQLite
        {
          provide: ActivatedRoute,  // Proveemos el ActivatedRoute real con un parámetro simulado
          useValue: {
            snapshot: {
              paramMap: { get: () => '1' }  // Simulamos el parámetro de la ruta como '1'
            }
          }
        },
        { provide: AlertController, useFactory: mockAlertController }  // Mock de AlertController
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditUserPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();  // Verifica que el componente se haya creado correctamente
  });
});
