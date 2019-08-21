import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscussionDetailsPage } from './discussion-details.page';

describe('DiscussionDetailsPage', () => {
  let component: DiscussionDetailsPage;
  let fixture: ComponentFixture<DiscussionDetailsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DiscussionDetailsPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiscussionDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
