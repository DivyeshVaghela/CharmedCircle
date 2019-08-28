import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GeneralService {

  constructor() { }

  range(limit: number, start?: number): Array<number>{
    if (!Number.isInteger(limit))
      limit = Math.ceil(limit);
    if (start){
      return Array(limit).fill(0).map((value, index) => start++);
    }
    return Array(limit).fill(0).map((value, index) => index);
  }

  distinct<T>(arrayOfObj: Array<T>, key: string): Array<T>{
    const result: T[] = [];
    const map = new Map();
    for (const item of arrayOfObj){
      if (!map.has(item[key])){
        map.set(item[key], true);
        result.push(item);
      }
    }
    return result;
  }
}
