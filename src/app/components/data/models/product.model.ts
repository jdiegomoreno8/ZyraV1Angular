export class Product {
  constructor(
    public id_producto: number,
    public nombre: string,
    public descripcion: string,
    public route?: string, // Ruta de navegación para la categoría (ej: calendar, productos, etc.)
    public image?: string,   // Imagen local desde assets
    public precio?: number,
    public cantidad_existente?: number,
  ) {}
}
