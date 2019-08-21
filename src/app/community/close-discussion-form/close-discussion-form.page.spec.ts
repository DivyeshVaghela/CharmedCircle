import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloseDiscussionFormPage } from './close-discussion-form.page';

describe('CloseDiscussionFormPage', () => {
  let component: CloseDiscussionFormPage;
  let fixture: ComponentFixture<CloseDiscussionFormPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CloseDiscussionFormPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloseDiscussionFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
