export class Area{

  constructor(
    public latitude: string,
    public longitude: string,

    public timestamp: number,

    public countryCode: string,
    public countryName: string,
    public administrativeArea: string,
    public subAdministrativeArea: string,
    
    public postalCode?: string,
    public subLocality?: string,
    public thoroughfare?: string,
    public subThoroughfare?: string,
    public areasOfInterest?: string[]
  ){
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
    const area = new Area(latitude, longitude, timestamp , countryCode, countryName, administrativeArea, subAdministrativeArea,
      postalCode, subLocality, thoroughfare, subThoroughfare, areasOfInterest);
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