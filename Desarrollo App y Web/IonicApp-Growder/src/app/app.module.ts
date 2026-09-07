import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { NativeStorage } from '@awesome-cordova-plugins/native-storage/ngx';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { LocalNotifications } from '@capacitor/local-notifications';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    MatProgressBarModule,
    BrowserAnimationsModule,
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    NativeStorage,
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor() {
    this.initializeLocalNotifications();
  }

  private async initializeLocalNotifications() {
    const permission = await LocalNotifications.requestPermissions();
    
    if (permission.display === 'granted') {
      console.log('Permisos concedidos para las notificaciones locales.');
    } else {
      console.log('Permisos denegados para las notificaciones locales.');
    }
  }
}