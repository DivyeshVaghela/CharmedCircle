import { Area } from './area.model';

export interface Location{

  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;

  area?: Area
}