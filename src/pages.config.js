/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminBanners from './pages/AdminBanners';
import AdminCategories from './pages/AdminCategories';
import AdminCoupons from './pages/AdminCoupons';
import AdminDashboard from './pages/AdminDashboard';
import AdminGallery from './pages/AdminGallery';
import AdminLogin from './pages/AdminLogin';
import AdminOrders from './pages/AdminOrders';
import AdminProducts from './pages/AdminProducts';
import AdminReviews from './pages/AdminReviews';
import AdminShipping from './pages/AdminShipping';
import AdminTips from './pages/AdminTips';
import Cart from './pages/Cart';
import Catalog from './pages/Catalog';
import Checkout from './pages/Checkout';
import Gallery from './pages/Gallery';
import Home from './pages/Home';
import MyOrders from './pages/MyOrders';
import ProductPage from './pages/ProductPage';
import Testimonials from './pages/Testimonials';
import Tips from './pages/Tips';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminBanners": AdminBanners,
    "AdminCategories": AdminCategories,
    "AdminCoupons": AdminCoupons,
    "AdminDashboard": AdminDashboard,
    "AdminGallery": AdminGallery,
    "AdminLogin": AdminLogin,
    "AdminOrders": AdminOrders,
    "AdminProducts": AdminProducts,
    "AdminReviews": AdminReviews,
    "AdminShipping": AdminShipping,
    "AdminTips": AdminTips,
    "Cart": Cart,
    "Catalog": Catalog,
    "Checkout": Checkout,
    "Gallery": Gallery,
    "Home": Home,
    "MyOrders": MyOrders,
    "ProductPage": ProductPage,
    "Testimonials": Testimonials,
    "Tips": Tips,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
