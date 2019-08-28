import { Community } from './community.model';

export interface CommunityArea{
  areaId?: string;
  countryCode: string;
  country: string;
  countryName?: string;
  state: string;
  city: string;

  communities?: Community[];
}