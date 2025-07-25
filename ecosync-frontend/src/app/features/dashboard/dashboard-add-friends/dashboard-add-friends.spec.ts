import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardAddFriends } from './dashboard-add-friends';

describe('DashboardAddFriends', () => {
  let component: DashboardAddFriends;
  let fixture: ComponentFixture<DashboardAddFriends>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardAddFriends]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardAddFriends);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
