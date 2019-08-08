import { Injectable, OnDestroy } from '@angular/core';
import { Geolocation, Geoposition } from '@ionic-native/geolocation/ngx';
import { BehaviorSubject, of, Observable, Subscription } from 'rxjs';
import { Platform } from '@ionic/angular';
import { Location } from '../models/location.model';
import { switchMap, throttleTime } from 'rxjs/operators';
import { NativeGeocoder, NativeGeocoderOptions, NativeGeocoderResult } from '@ionic-native/native-geocoder/ngx';
import { Area } from '../models/area.model';
import { AccountService } from './account.service';

@Injectable({
  providedIn: 'root'
})
export class LocationService implements OnDestroy {

  location$ = new BehaviorSubject<Location>(null);
  locationUpdateInterval = 60;  //seconds
  areaUpdateInterval = 180;     //seconds
  private subscriptions = new Subscription();
  geocoderOptions: NativeGeocoderOptions = {
    useLocale: true,
    maxResults: 1
  };

  constructor(
    private platform: Platform,
    private geolocation: Geolocation,
    private nativeGeocoder: NativeGeocoder,
    private accountService: AccountService) {

    this.platform.ready().then(() => {

      this.startLocationTracking();

      this.location$.subscribe((position: Location) => {
        if (position != null)
          accountService.updateLastKnownLocation(position);
      });

      // geolocation.getCurrentPosition().then((position: Geoposition) => {
      //   console.log('got the position', position);
      //   const { latitude, longitude, accuracy } = position.coords;
      //   this.location$.next({
      //     latitude, longitude, accuracy,
      //     timestamp: position.timestamp
      //   });
      // }, error => {
      //   console.log(error);
      // });
    });
  }

  startLocationTracking(){

    this.subscriptions.add(this.geolocation.watchPosition().pipe(
      throttleTime(this.locationUpdateInterval * 1000),
      switchMap((position: Geoposition) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newPosition: Location = { latitude, longitude, accuracy, timestamp: position.timestamp };
        return of(newPosition);
      })
    ).subscribe((position: Location) => {
      this.resolveReverseGeocode(position).then((area: Area) => {
        position.area = area;
        this.location$.next(position);
      }, error => {
        console.log('error in getting area', error);
        this.location$.next(position);
      });

    }, error => {
      console.log('Location change error', error);
    }));
  }

  stopLocationTraking(){
    if (this.subscriptions != null){
      this.subscriptions.unsubscribe();
    }
  }

  async resolveReverseGeocode(position: Location): Promise<Area> {
    const geocoderResults: NativeGeocoderResult[] = await this.nativeGeocoder.reverseGeocode(position.latitude, position.longitude, this.geocoderOptions);
    return Area.toArea(geocoderResults[0]);
  }

  ngOnDestroy(): void {
    this.stopLocationTraking();
  }
}
