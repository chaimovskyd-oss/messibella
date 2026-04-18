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
import AdminOrders from './pages/AdminOrders';
import AdminProducts from './pages/AdminProducts';
import AdminReviews from './pages/AdminReviews';
import AdminShipping from './pages/AdminShipping';
import Cart from './pages/Cart';
import Catalog from './pages/Catalog';
import Checkout from './pages/Checkout';
import Home from './pages/Home';
import MyOrders from './pages/MyOrders';
import ProductPage from './pages/ProductPage';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminBanners": AdminBanners,
    "AdminCategories": AdminCategories,
    "AdminCoupons": AdminCoupons,
    "AdminDashboard": AdminDashboard,
    "AdminOrders": AdminOrders,
    "AdminProducts": AdminProducts,
    "AdminReviews": AdminReviews,
    "AdminShipping": AdminShipping,
    "Cart": Cart,
    "Catalog": Catalog,
    "Checkout": Checkout,
    "Home": Home,
    "MyOrders": MyOrders,
    "ProductPage": ProductPage,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};