import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscussionListPage } from './discussion-list.page';

describe('DiscussionListPage', () => {
  let component: DiscussionListPage;
  let fixture: ComponentFixture<DiscussionListPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DiscussionListPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiscussionListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
