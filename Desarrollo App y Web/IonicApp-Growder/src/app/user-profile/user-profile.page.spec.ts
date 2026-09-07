import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserProfilePage } from './user-profile.page';
import { ServicebdService } from 'src/app/services/servicesbd.service';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';
import { AlertController } from '@ionic/angular';

// Mock de AlertController
function mockAlertController() {
  return {
    create: jasmine.createSpy().and.returnValue({
      present: jasmine.createSpy().and.returnValue(Promise.resolve()),  
      dismiss: jasmine.createSpy().and.returnValue(Promise.resolve())
    })
  };
}

describe('UserProfilePage', () => {
  let component: UserProfilePage;
  let fixture: ComponentFixture<UserProfilePage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserProfilePage],
      providers: [
        ServicebdService,
        { provide: SQLite, useValue: {} },  
        { provide: AlertController, useFactory: mockAlertController }  
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();  
  });
});
