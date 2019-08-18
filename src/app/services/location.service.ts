import { Injectable, OnDestroy } from '@angular/core';
import { Platform } from '@ionic/angular';

import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';

import { Storage } from '@ionic/storage';
import { Geolocation, Geoposition } from '@ionic-native/geolocation/ngx';
import { NativeGeocoder, NativeGeocoderOptions, NativeGeocoderResult } from '@ionic-native/native-geocoder/ngx';

import { BehaviorSubject, of, Observable, Subscription } from 'rxjs';
import { switchMap, throttleTime, take } from 'rxjs/operators';
import { resolve } from 'url';
import { reject } from 'q';

import { AuthService } from './auth.service';
import { AccountService } from './account.service';
import { User } from '../models/user.model';
import { Location } from '../models/location.model';
import { Area } from '../models/area.model';
import { CommunityArea } from '../models/community-area.model';
import { SlugifyPipe } from '../pipes/slugify.pipe';


@Injectable({
  providedIn: 'root'
})
export class LocationService implements OnDestroy {

  location$ = new BehaviorSubject<Location>(null);
  locationUpdateInterval = 60;  //seconds
  areaUpdateInterval = 180;     //seconds
  private watchLocationSubscription: Subscription;
  geocoderOptions: NativeGeocoderOptions = {
    useLocale: true,
    maxResults: 1
  };

  constructor(
    private platform: Platform,
    private geolocation: Geolocation,
    private nativeGeocoder: NativeGeocoder,
    
    private storage: Storage,
    private afStore: AngularFirestore,
    
    private accountService: AccountService,
    private authService: AuthService,
    private slugifyPipe: SlugifyPipe) {

    this.platform.ready().then(() => {

      this.startLocationTracking();

      this.location$.subscribe((position: Location) => {
        if (position != null)
          this.updateLastKnownLocation(position);
      });

      this.authService.user$.subscribe(user => {
        if (user == null){
          if (this.watchLocationSubscription != null){
            this.watchLocationSubscription.unsubscribe();
            this.watchLocationSubscription = null;
            console.log('Location traking stopped');
          }
        } else if (this.watchLocationSubscription == null){
          this.startLocationTracking();
          console.log('Location traking started');
        }
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

    if (!this.authService.isAuthenticated()) return;

    this.watchLocationSubscription = this.geolocation.watchPosition().pipe(
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
    });
  }

  stopLocationTraking(){
    if (this.watchLocationSubscription != null) this.watchLocationSubscription.unsubscribe();
  }

  async resolveReverseGeocode(position: Location): Promise<Area> {
    const geocoderResults: NativeGeocoderResult[] = await this.nativeGeocoder.reverseGeocode(position.latitude, position.longitude, this.geocoderOptions);
    return Area.toArea(geocoderResults[0]);
  }

  updateLastKnownLocation(location: Location): Promise<void>{
    return Promise.all([
      // this.updateLastKnownLocationInStore(location),
      this.updateLastKnownLocationInDevice(location)
    ]).then(
      () => { resolve; },
      () => { reject; }
    );
  }

  updateLastKnownLocationInStore(location: Location): Promise<void> | void{
    if (this.authService.isAuthenticated()){
      const userRef: AngularFirestoreDocument<User> = this.afStore.doc<User>(`users/${this.authService.user$.value.uid}`);
      let data = {};

      if (this.authService.user$.value.lastKnownLocation &&
        this.authService.user$.value.lastKnownLocation.area &&
        location.area.equalsArea(this.authService.user$.value.lastKnownLocation.area)){
        const {latitude, longitude, accuracy, timestamp} = location;
        data = {
          "lastKnownLocation.latitude": latitude,
          "lastKnownLocation.longitude": longitude,
          "lastKnownLocation.accuracy": accuracy,
          "lastKnownLocation.timestamp": timestamp
        };
        // console.log('Area not updated');
      } else {
        location.area = location.area.toPlainObject();
        data = {
          lastKnownLocation: location
        };
        // console.log('Area updated');
      }
      return userRef.update(data);
    }
  }

  async updateLastKnownLocationInDevice(location: Location): Promise<any>{
    if (this.authService.isAuthenticated()){
      let userInfo: User = await this.storage.get(this.authService.USER_KEY);
      userInfo.lastKnownLocation = location;
      await this.storage.set(this.authService.USER_KEY, userInfo);
    }
  }

  getAreaId(area?: {countryCode: string, state: string, city: string}){
    if (area == null){
      if (this.location$.value == null) return null;

      area = this.location$.value.area;
    }
    const countryCodeSlug = this.slugifyPipe.transform(area.countryCode.toLowerCase());
    const stateSlug = this.slugifyPipe.transform(area.state.toLowerCase());
    const citySlug = this.slugifyPipe.transform(area.city.toLowerCase());
    let areaId = `${countryCodeSlug}-${stateSlug}-${citySlug}`;
    return areaId;
  }

  getCommunityArea(areaId: string): Observable<CommunityArea> {
    const communityAreaDocRef = this.afStore.doc<CommunityArea>(`/communityAreas/${areaId}`);
    return communityAreaDocRef.valueChanges();
  }

  getLastLocationFromDevice(){
    if (this.authService.user$.value != null && this.authService.user$.value.lastKnownLocation != null){
      this.location$.next(this.authService.user$.value.lastKnownLocation);
    }
  }

  canTakeAction(action: { areaId: string }, location?: { countryCode: string, state: string, city: string }): boolean{
    return (action.areaId === this.getAreaId());
  }

  ngOnDestroy(): void {
    this.stopLocationTraking();
  }
}
