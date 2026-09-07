import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, Observer } from 'rxjs'; // Asegúrate de importar Observer
import { map, catchError } from 'rxjs/operators';
import { NativeStorage } from '@awesome-cordova-plugins/native-storage/ngx';


@Injectable({
  providedIn: 'root'
})
export class ExchangeRateService {
  private apiKey = '8592b242a7a3e85282b2f24b'; // Asegúrate de que esta sea tu clave API válida
  private apiUrl = `https://v6.exchangerate-api.com/v6/${this.apiKey}/latest/USD`;

  constructor(private http: HttpClient, private nativeStorage: NativeStorage) {}

  // Obtener el valor del dólar (actualizado o almacenado)
  getDollarValue(): Observable<number> {
    return new Observable<number>((observer: Observer<number>) => { // Tipamos el observer como Observer<number>
      this.nativeStorage.getItem('dollarData').then((storedData) => {
        const currentDate = new Date();
        if (storedData) {
          const storedDate = new Date(storedData.date);
          const diffInDays = Math.floor((currentDate.getTime() - storedDate.getTime()) / (1000 * 3600 * 24));

          // Si el valor está actualizado (1 día como máximo), lo usamos
          if (diffInDays < 1) {
            observer.next(storedData.value);
            observer.complete();
          } else {
            // Si está desactualizado, obtenemos un nuevo valor de la API
            this.fetchDollarValue(observer);
          }
        } else {
          // Si no hay valor guardado, obtenemos un nuevo valor
          this.fetchDollarValue(observer);
        }
      }).catch(() => {
        this.fetchDollarValue(observer);
      });
    });
  }

  // Función para obtener el valor del dólar desde la API
  private fetchDollarValue(observer: Observer<number>) { // Aquí tipamos correctamente el observer
    this.http.get<any>(this.apiUrl).pipe(
      map((data) => {
        if (data && data.conversion_rates && data.conversion_rates.CLP) {
          const dollarValue = data.conversion_rates.CLP;
          const currentDate = new Date();
          // Guardamos el valor y la fecha en el almacenamiento nativo
          this.nativeStorage.setItem('dollarData', {
            value: dollarValue,
            date: currentDate.toISOString()
          });
          observer.next(dollarValue);
          observer.complete();
        } else {
          observer.error(new Error('Datos no válidos recibidos de la API'));
        }
      }),
      catchError((error) => {
        observer.error(this.handleError(error));
        return throwError(() => new Error('Error al obtener el valor del dólar'));
      })
    ).subscribe();
  }

  convertToChileanPesos(amount: number): Observable<number> {
    return this.getDollarValue().pipe(
      map((dollarValue) => amount * dollarValue),
      catchError((error) => {
        return throwError(this.handleError(error));
      })
    );
  }

  private handleError(error: HttpErrorResponse | Error): string {
    console.error('Ocurrió un error en la solicitud:', error);
    return 'Error de conexión con la API. Por favor, verifica tu conexión a Internet o intenta más tarde.';
  }
}
