import { lazy } from 'react'
import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './providers'
import { Layout } from '../components/layout/Layout'
import { EmptyState, ErrorMessage, Loading } from '../components/ui/Feedback'
import { CatalogPage, HomePage } from '../pages/Catalog'

const ProductPage = lazy(() =>
  import('../pages/Product').then((module) => ({ default: module.ProductPage })),
)
const ProductCreatePage = lazy(() =>
  import('../pages/ProductCreate').then((module) => ({ default: module.ProductCreatePage })),
)
const CheckoutPage = lazy(() =>
  import('../pages/Checkout').then((module) => ({ default: module.CheckoutPage })),
)
const AuthPage = lazy(() =>
  import('../pages/Auth').then((module) => ({ default: module.AuthPage })),
)
const OrdersPage = lazy(() =>
  import('../pages/Orders').then((module) => ({ default: module.OrdersPage })),
)
const OrderDetailPage = lazy(() =>
  import('../pages/OrderDetail').then((module) => ({ default: module.OrderDetailPage })),
)
const ProfilePage = lazy(() =>
  import('../pages/Profile').then((module) => ({ default: module.ProfilePage })),
)
const HelpPage = lazy(() =>
  import('../pages/Help').then((module) => ({ default: module.HelpPage })),
)

function Protected({ children, manager = false }: { children: ReactNode; manager?: boolean }) {
  const { user, loading, error } = useAuth()
  const location = useLocation()
  if (loading) return <Loading />
  if (error) return <ErrorMessage error={error} />
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  if (manager && user.role !== 'manager') return <Navigate to="/account/orders" replace />
  return children
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="catalog/:slug" element={<ProductPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="login" element={<AuthPage />} />
        <Route path="register" element={<AuthPage />} />
        <Route path="delivery" element={<HelpPage />} />
        <Route
          path="account/orders"
          element={
            <Protected>
              <OrdersPage />
            </Protected>
          }
        />
        <Route
          path="account/orders/:id"
          element={
            <Protected>
              <OrderDetailPage />
            </Protected>
          }
        />
        <Route
          path="account/profile"
          element={
            <Protected>
              <ProfilePage />
            </Protected>
          }
        />
        <Route
          path="manager/products/new"
          element={
            <Protected manager>
              <ProductCreatePage />
            </Protected>
          }
        />
        <Route
          path="manager/orders"
          element={
            <Protected manager>
              <OrdersPage manager />
            </Protected>
          }
        />
        <Route
          path="manager/orders/:id"
          element={
            <Protected manager>
              <OrderDetailPage />
            </Protected>
          }
        />
        <Route
          path="*"
          element={
            <EmptyState title="Здесь пока чистый лист" action>
              Такой страницы нет. Начните с каталога продукции.
            </EmptyState>
          }
        />
      </Route>
    </Routes>
  )
}
