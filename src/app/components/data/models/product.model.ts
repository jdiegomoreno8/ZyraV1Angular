/** product.model.ts
 * Modelo que representa una categoría o producto.
 */
export class Product {
  /**
   * @param id_producto Identificador único del producto/categoría
   * @param nombre Nombre de la categoría/producto
   * @param descripcion Descripción breve
   * @param route Ruta para navegación (ejemplo: 'calendar', 'productos')
   * @param image Ruta o URL a imagen representativa del producto (desde assets)
   * @param precio Precio (opcional)
   * @param cantidad_existente Cantidad disponible (opcional)
   * @param badge
   * @param colorClass
   * @param iconClass
   * 
   */
  constructor(
    public id_producto: number,
    public nombre: string,
    public descripcion: string,
    public route?: string,
    public image?: string,
    public precio?: number,
    public cantidad_existente?: number,
        // Nuevos campos visuales
    public badge?: string,       // "Nuevo", "Popular", etc.
    public colorClass?: string,  // Clase CSS dinámica
    public iconClass?: string    // Icono bootstrap personalizado
  ) {}
}
