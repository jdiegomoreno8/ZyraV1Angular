import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnularCitaComponent } from './anular-cita.component';

describe('AnularCitaComponent', () => {
  let component: AnularCitaComponent;
  let fixture: ComponentFixture<AnularCitaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnularCitaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnularCitaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
