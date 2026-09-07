import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ServicebdService } from 'src/app/services/servicesbd.service';

@Component({
  selector: 'app-iniciotienda',
  templateUrl: './iniciotienda.page.html',
  styleUrls: ['./iniciotienda.page.scss'],
})
export class IniciotiendaPage implements OnInit {
  isLoggedIn: boolean = false; // Estado de inicio de sesión

  constructor(private router: Router, private db: ServicebdService) {}

  ngOnInit() {
    // Suscribirse al estado de inicio de sesión
    this.db.isUserLoggedIn.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn; // Actualizar el estado local
    });
  }

  irRegistro() {
    this.router.navigate(['/login']);
  }

  irTienda() {
    this.router.navigate(['/tienda']);
  }

  // Método simulado para iniciar sesión
  login(username: string, password: string) {
    // Aquí iría tu lógica de autenticación
    if (username && password) {
      this.isLoggedIn = true; // Cambia el estado al iniciar sesión
      this.db.setUserLoggedIn(true); // Actualiza el estado en el servicio
      console.log('Usuario logueado:', username);
    }
  }

  // Método para cerrar sesión
  logout() {
    this.isLoggedIn = false; // Cambia el estado al cerrar sesión
    this.db.setUserLoggedIn(false); // Actualiza el estado en el servicio
    console.log('Usuario deslogueado');
  }
}
