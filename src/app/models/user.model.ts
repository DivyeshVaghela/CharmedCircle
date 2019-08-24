import { Location } from './location.model';

export interface User{
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  
  lastLoginTime?: Date;
  lastLogoutTime?: Date;

  lastKnownLocation?: Location;
  joinedCommunities?: JoinedCommunity[];

  provider?: string;
}

export interface JoinedCommunity{
  areaId: string;
  communityId: string;
  name: string;
  timestamp?: number;
}