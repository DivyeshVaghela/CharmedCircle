import { TestBed } from '@angular/core/testing';

import { QueAnsService } from './que-ans.service';

describe('QueAnsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: QueAnsService = TestBed.get(QueAnsService);
    expect(service).toBeTruthy();
  });
});
