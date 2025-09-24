import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductEmpresasDialogComponent } from './product-empresas-dialog.component';

describe('ProductEmpresasDialogComponent', () => {
  let component: ProductEmpresasDialogComponent;
  let fixture: ComponentFixture<ProductEmpresasDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductEmpresasDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductEmpresasDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
