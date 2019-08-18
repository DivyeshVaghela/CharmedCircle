export interface UserAsset{
  
  data?: any;
  blob?: Blob;
  
  name: string;
  type: string;
  size: number;
  
  lastModified?: number;
  lastModifiedDate?: number;
}