import { Product } from '../models/product.model';


export const PRODUCTS: Product[] = [
  new Product(1, /*este id se relaciona con el id de la bd*/
    'Parafernalia',
    'Venta de accesorios recreativos',
    'calendar',
    'assets/images/open.jpg'
  ),
  new Product(2,
    'Tecnológia',
    'Servicios y soluciones tecnológicas',
    'calendar',
    'assets/images/renta.png'
  ),
  new Product(3,
    'Produtos de Belleza',
    'Todo en artículos para dama',
    'calendar',
    'assets/images/belleza.jpeg'
  ),
  new Product(4,
    'Boutique o armario',
    'Ropa y accesorios para todos los gustos',
    'calendar',
    'assets/images/renta.png'
  ),
    new Product(5,
    'Sex Shop',
    'Ropa y accesorios para todos los gustos',
    'calendar',
    'assets/images/publicidad.png'
  ),
     new Product(6,
    'Perfumes',
    'Olores y fragancias para todos los gustos',
    'calendar',
    'assets/images/renta.png'
  ),
     new Product(7,
    'Artesanal',
    'Accesorios hechos a mano para todos los gustos',
    'calendar',
    'assets/images/renta.png'
  ),
];
