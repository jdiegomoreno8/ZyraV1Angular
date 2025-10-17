//product.ts
import { Product } from '../models/product.model';


// export const PRODUCTS: Product[] = [
//   new Product(1, /*este id se relaciona con el id de la bd*/
//     'Parafernalia',
//     'Venta de accesorios recreativos',
//     'calendar',
//     'assets/images/open.jpg',
    
//   ),
//   new Product(2,
//     'Tecnológia',
//     'Servicios y soluciones tecnológicas',
//     'calendar',
//     'assets/images/renta.png'
//   ),
//   new Product(3,
//     'Produtos de Belleza',
//     'Todo en artículos para dama',
//     'calendar',
//     'assets/images/belleza.jpeg'
//   ),
//   new Product(4,
//     'Boutique o armario',
//     'Ropa y accesorios para todos los gustos',
//     'calendar',
//     'assets/images/renta.png'
//   ),
//     new Product(5,
//     'Sex Shop',
//     'Ropa y accesorios para todos los gustos',
//     'calendar',
//     'assets/images/publicidad.png'
//   ),
//      new Product(6,
//     'Perfumes',
//     'Olores y fragancias para todos los gustos',
//     'calendar',
//     'assets/images/renta.png'
//   ),
//      new Product(7,
//     'Artesanal',
//     'Accesorios hechos a mano para todos los gustos',
//     'calendar',
//     'assets/images/renta.png'
//   ),
// ];
export const PRODUCTS: Product[] = [
  new Product(1, 'Parafernalia', 'Venta de accesorios recreativos', 'calendar', 'assets/images/open.jpg', 0, 0, 'Popular', 'bg-paraf', 'bi-stars'),
  new Product(2, 'Tecnología', 'Servicios y soluciones tecnológicas', 'calendar', 'assets/images/renta.png', 0, 0, 'Proximamente', 'bg-tech', 'bi-cpu'),
  new Product(3, 'Belleza', 'Todo en artículos para dama', 'calendar', 'assets/images/belleza.jpeg', 0, 0, 'Oferta', 'bg-belleza', 'bi-droplet'),
  new Product(4, 'Boutique', 'Ropa y accesorios', 'calendar', 'assets/images/renta.png', 0, 0, 'Proximamente', 'bg-boutique', 'bi-bag'),
  new Product(5, 'Sex Shop', 'Productos para adultos', 'calendar', 'assets/images/publicidad.png', 0, 0, 'Popular', 'bg-sexy', 'bi-heart-fill'),
  new Product(6, 'Perfumes', 'Fragancias para todos los gustos', 'calendar', 'assets/images/renta.png', 0, 0, 'Proximamente', 'bg-perfume', 'bi-flower2'),
  new Product(7, 'Artesanal', 'Accesorios hechos a mano', 'calendar', 'assets/images/renta.png', 0, 0, 'Proximamente', 'bg-artesanal', 'bi-gem')
];
