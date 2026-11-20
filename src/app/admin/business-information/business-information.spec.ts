import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BusinessInformation } from './business-information';

describe('BusinessInformation', () => {
  let component: BusinessInformation;
  let fixture: ComponentFixture<BusinessInformation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessInformation],
    }).compileComponents();

    fixture = TestBed.createComponent(BusinessInformation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
