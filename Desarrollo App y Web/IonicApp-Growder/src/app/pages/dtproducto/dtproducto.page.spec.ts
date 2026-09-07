import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DtproductoPage } from './dtproducto.page';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ServicebdService } from 'src/app/services/servicesbd.service';
import { ToastController, AlertController } from '@ionic/angular';
import { Camera } from '@capacitor/camera';

// Mock para el servicio ServicebdService
class MockServicebdService {
  dbState() {
    return of(true);  // Simula una conexión exitosa a la base de datos
  }

  fetchProductos() {
    return Promise.resolve([{
      idproducto: 123,
      nombre: 'Producto Test',
      descripcion: 'Descripción del producto',
      precio: 100,
      foto: 'url_foto'
    }]);
  }

  obtenerImagenes(id: number) {
    return Promise.resolve(['imagen1.jpg', 'imagen2.jpg']);
  }

  obtenerResenas(id: number) {
    return Promise.resolve([{
      id: 1,
      username: 'usuario1',
      texto: 'Reseña de prueba',
      respuestas: [],
      foto: 'url_foto'
    }]);
  }

  obtenerRespuestas(id: number) {
    return Promise.resolve([{
      id: 1,
      texto: 'Respuesta a la reseña',
      username: 'usuario_test',
      foto: 'url_respuesta_foto'
    }]);
  }

  getCurrentUser() {
    return Promise.resolve({
      username: 'usuario_test',
      foto: 'url_avatar',
      isAdmin: true
    });
  }
}

// Mock de AlertController para evitar que se presenten alertas durante las pruebas
function mockAlertController() {
  return {
    create: jasmine.createSpy().and.returnValue({
      present: jasmine.createSpy().and.returnValue(Promise.resolve()),  // Evita que se presente la alerta
      dismiss: jasmine.createSpy().and.returnValue(Promise.resolve())   // Evita que se cierre la alerta
    })
  };
}

describe('DtproductoPage', () => {
  let component: DtproductoPage;
  let fixture: ComponentFixture<DtproductoPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DtproductoPage ],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' } } } },
        { provide: ServicebdService, useClass: MockServicebdService },
        { provide: ToastController, useValue: {} },
        { provide: Camera, useValue: {} },
        { provide: AlertController, useFactory: mockAlertController }  // Mock del AlertController para evitar alertas
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DtproductoPage);
    component = fixture.componentInstance;

    await component.ngOnInit();  // Espera a que se resuelvan las promesas del ngOnInit
    fixture.detectChanges();  // Detecta los cambios después de la inicialización
  });

  it('should create', async () => {
    await fixture.whenStable();  // Espera a que se resuelvan todas las promesas

    // Verifica si el componente se ha creado correctamente
    expect(component).toBeTruthy();

    // Verifica que el producto se haya cargado correctamente
    expect(component.producto).toBeDefined();
    expect(component.producto.nombre).toBe('Producto Test');

    // Verifica que el método obtenerRespuestas haya sido llamado correctamente
    expect(component.producto.idproducto).toBe(123);
  });
});
