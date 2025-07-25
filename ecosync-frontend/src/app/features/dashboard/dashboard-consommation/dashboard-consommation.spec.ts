import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardConsommation } from './dashboard-consommation';

describe('DashboardConsommation', () => {
  let component: DashboardConsommation;
  let fixture: ComponentFixture<DashboardConsommation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardConsommation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardConsommation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
