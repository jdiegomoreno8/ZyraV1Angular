export class Product {
  constructor(
    public id_producto: number,
    public nombre: string,
    public descripcion: string,
    public route?: string,  // Ruta interna de navegación
    public image?: string   // Imagen local desde assets
  ) {}
}
