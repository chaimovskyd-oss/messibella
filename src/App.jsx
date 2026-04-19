import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { queryClientInstance } from '@/lib/query-client';
import { pagesConfig } from './pages.config';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from '@/components/ScrollToTop';
import { PAGE_ROUTES, createPageUrl } from '@/utils';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout
  ? <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

function FullPageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
    </div>
  );
}

function AdminRoute({ pageName, children }) {
  const { isAuthenticated, isLoadingAuth, authChecked } = useAuth();

  if (isLoadingAuth || !authChecked) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to={createPageUrl('AdminLogin')} replace />;
  }

  return (
    <LayoutWrapper currentPageName={pageName}>
      {children}
    </LayoutWrapper>
  );
}

function LegacyRedirect({ pageName }) {
  return <Navigate to={createPageUrl(pageName)} replace />;
}

function AuthenticatedApp() {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();

  if (isLoadingPublicSettings) {
    return <FullPageLoader />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={(
          <LayoutWrapper currentPageName={mainPageKey}>
            <MainPage />
          </LayoutWrapper>
        )}
      />

      {Object.entries(Pages).map(([pageName, Page]) => {
        if (pageName === mainPageKey) {
          return null;
        }

        const routePath = PAGE_ROUTES[pageName] || createPageUrl(pageName);
        const isAdminPage = pageName.startsWith('Admin') && pageName !== 'AdminLogin';

        return (
          <Route
            key={pageName}
            path={routePath}
            element={isAdminPage ? (
              <AdminRoute pageName={pageName}>
                <Page />
              </AdminRoute>
            ) : (
              <LayoutWrapper currentPageName={pageName}>
                <Page />
              </LayoutWrapper>
            )}
          />
        );
      })}

      {Object.entries(Pages).map(([pageName]) => {
        if (pageName === mainPageKey) {
          return null;
        }

        const legacyPath = `/${pageName}`;
        const targetPath = PAGE_ROUTES[pageName] || legacyPath;
        if (legacyPath === targetPath || (pageName === 'Home' && targetPath === '/')) {
          return null;
        }

        return <Route key={`${pageName}-legacy`} path={legacyPath} element={<LegacyRedirect pageName={pageName} />} />;
      })}

      {!isLoadingAuth && <Route path="*" element={<PageNotFound />} />}
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
