import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

@Injectable({
  providedIn: 'root'
})
export class GeoService {

  constructor(private http: HttpClient) { }

  public searchPlace(place: string) {

    const params = new HttpParams()
      .set('q', place)
      .set('format', 'json')
      .set('addressdetails', 'addressdetails')

    return this.http.get(`${NOMINATIM_BASE_URL}/search`, { params })
    
  }



  public buscarDireccion(latitud:number , longitud:number){
    const params = new HttpParams()
      .set('lat', latitud)
      .set('lon', longitud)
      .set('format', 'jsonv2')

    return this.http.get(`${NOMINATIM_BASE_URL}/reverse`, { params })
    
  }

}
