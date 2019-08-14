import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunityFormPage } from './community-form.page';

describe('CommunityFormPage', () => {
  let component: CommunityFormPage;
  let fixture: ComponentFixture<CommunityFormPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CommunityFormPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CommunityFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
