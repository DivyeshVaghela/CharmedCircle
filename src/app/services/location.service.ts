import { Injectable, OnDestroy } from '@angular/core';
import { Platform } from '@ionic/angular';

import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { FireSQL } from 'firesql';

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
import { GeneralService } from './general.service';
import { LocationAccuracy } from '@ionic-native/location-accuracy/ngx';
import { AndroidPermissions, AndroidPermissionResponse } from '@ionic-native/android-permissions/ngx';


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
    private locationAccuracy: LocationAccuracy,
    
    private storage: Storage,
    private afStore: AngularFirestore,
    
    private accountService: AccountService,
    private authService: AuthService,
    private slugifyPipe: SlugifyPipe,
    private generalService: GeneralService,
    private androidPermissions: AndroidPermissions) {

    this.platform.ready().then(() => {

      this.startLocationTracking();

      this.location$.subscribe((position: Location) => {
        if (position != null)
          this.updateLastKnownLocation(position);
      });

      // this.authService.user$.subscribe(user => {
      //   if (user == null){
      //     if (this.watchLocationSubscription != null){
      //       this.watchLocationSubscription.unsubscribe();
      //       this.watchLocationSubscription = null;
      //       console.log('Location traking stopped');
      //     }
      //   } else if (this.watchLocationSubscription == null){
      //     this.startLocationTracking();
      //     console.log('Location traking started');
      //   }
      // });

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

    // if (!this.authService.isAuthenticated()) return;

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

        if (area.countryName && area.countryName.trim() !== '' && area.administrativeArea && area.administrativeArea.trim() !== '' &&
          area.subAdministrativeArea && area.subAdministrativeArea.trim() !== ''){
          this.location$.next(position);
        }
      }, error => {
        console.log('error in getting area', error);
        // this.location$.next(position);
      });

    }, error => {
      console.log('Location change error', error);
    });
  }

  stopLocationTraking(){
    if (this.watchLocationSubscription != null){
      this.watchLocationSubscription.unsubscribe();
      this.watchLocationSubscription = null;
    }
  }

  async resolveReverseGeocode(position: Location): Promise<Area> {
    const geocoderResults: NativeGeocoderResult[] = await this.nativeGeocoder.reverseGeocode(position.latitude, position.longitude, this.geocoderOptions);
    return Area.toArea(geocoderResults[0]);
  }

  updateLastKnownLocation(location: Location): Promise<void>{
    return Promise.all([
      this.updateLastKnownLocationInStore(location),
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
    let area = null;
    if (location)
      area = this.getAreaId(location);
    else
      area = this.getAreaId();
    return (action.areaId === area);
  }

  ngOnDestroy(): void {
    this.stopLocationTraking();
  }

  /**
   * Community Areas related methods
   */

  async getCountries(): Promise<{country: string, countryCode: string}[]>{
    const fireSQL = new FireSQL(this.afStore.firestore);
    const query = `SELECT country, countryCode FROM communityAreas ORDER BY country`;
    const result = await fireSQL.query<{country: string, countryCode: string}>(query);

    return this.generalService.distinct<{country: string, countryCode: string}>(result, 'countryCode');
  }

  async getStates(countryCode: string): Promise<{ state: string }[]>{
    const fireSQL = new FireSQL(this.afStore.firestore);
    const query = `SELECT state FROM communityAreas WHERE countryCode = '${countryCode}' ORDER BY state`;
    const result = await fireSQL.query<{ state: string }>(query);

    return this.generalService.distinct<{ state: string }>(result, 'state');
  }

  async getLocalities(countryCode: string, state: string): Promise<{ city: string }[]>{
    const fireSQL = new FireSQL(this.afStore.firestore);
    const query = `SELECT city FROM communityAreas WHERE countryCode = '${countryCode}' AND state = '${state}' ORDER BY city`;
    const result = await fireSQL.query<{ city: string }>(query);

    return this.generalService.distinct<{ city: string }>(result, 'city');
  }

  /**
   * Permission related things
   */
  checkLoacationPermission(): Promise<AndroidPermissionResponse>{
    return this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.ACCESS_COARSE_LOCATION);
  }

  async isLocationPermissionProvided(exitApp: boolean = true): Promise<boolean>{
    try{
      const response = await this.checkLoacationPermission();
      if (!response.hasPermission && exitApp)
        navigator['app'].exitApp();
      return response.hasPermission;
    } catch(error){
      console.log('Permission check error', error);
      return false;
    }
  }

  
  async askToTurnOnGPS(exitApp: boolean = true): Promise<boolean>{
    /**
     * code 0: Location settings satisfied
     * code 1: Granted
     * code 2: not granted
     */
    try{
      const status = await this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY);

      this.stopLocationTraking();
      this.startLocationTracking();

      if (status.code === this.locationAccuracy.SUCCESS_USER_AGREED){
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(true);
          }, 2000);
        });
      }

      return true;
    } catch (error){
      console.log('Error location permission asking', error);
      if (exitApp)
        navigator['app'].exitApp();
      return false;
    }
  }
}
