export class Area{

  public latitude?: string;
  public longitude?: string;

  public timestamp?: number;

  public countryCode: string;
  public countryName: string;
  public administrativeArea: string;
  public subAdministrativeArea: string;
  
  public postalCode?: string;
  public subLocality?: string;
  public thoroughfare?: string;
  public subThoroughfare?: string;
  public areasOfInterest?: string[];

  constructor(){
  }

  get state(): string {
    return this.administrativeArea;
  }
  
  get city(): string {
    return this.subAdministrativeArea;
  }

  static toArea(source: any, timestamp = Date.now()): Area{
    const { latitude, longitude, countryCode, countryName, administrativeArea, subAdministrativeArea,
      postalCode, subLocality, thoroughfare, subThoroughfare, areasOfInterest
    } = source;
    const area = new Area();
    area.latitude = latitude; area.longitude = longitude;
    area.timestamp = timestamp;
    area.countryCode = countryCode; area.countryName = countryName;
    area.administrativeArea = administrativeArea; area.subAdministrativeArea = subAdministrativeArea;
    area.postalCode = postalCode;
    area.subLocality = subLocality;
    area.thoroughfare = thoroughfare; area.subThoroughfare = subThoroughfare;
    area.areasOfInterest = areasOfInterest;
    return area;
  }

  toPlainObject(){
    return Object.assign({}, this);
  }

  equalsArea(anotherArea: Area): boolean {

    return (
      this.countryCode === anotherArea.countryCode &&
      this.countryName === anotherArea.countryName &&
      this.administrativeArea === anotherArea.administrativeArea &&
      this.subAdministrativeArea === anotherArea.subAdministrativeArea &&
      this.subLocality === anotherArea.subLocality &&
      this.postalCode === anotherArea.postalCode &&
      this.thoroughfare === anotherArea.thoroughfare &&
      this.subThoroughfare === anotherArea.subThoroughfare &&
      JSON.stringify(this.areasOfInterest) === JSON.stringify(anotherArea.areasOfInterest)
    )
  }
}