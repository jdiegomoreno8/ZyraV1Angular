import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmpresaProductosComponent } from './empresa-productos.component';

describe('EmpresaProductosComponent', () => {
  let component: EmpresaProductosComponent;
  let fixture: ComponentFixture<EmpresaProductosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmpresaProductosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmpresaProductosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
