import { Location } from './location.model';

export interface User{
  uid: String;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  
  lastLoginTime?: Date;
  lastLogoutTime?: Date;

  lastKnownLocation?: Location;
}