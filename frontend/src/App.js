import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { AuthModalProvider } from "@/components/AuthModal";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import Rental from "@/pages/Rental";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import OrderTrack from "@/pages/OrderTrack";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Account from "@/pages/Account";
import AuthCallback from "@/pages/AuthCallback";
import Wishlist from "@/pages/Wishlist";
import Contact from "@/pages/Contact";
import Policies from "@/pages/Policies";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminOffers from "@/pages/admin/AdminOffers";

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/rental" element={<Rental />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/track/:id" element={<OrderTrack />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/account" element={<Account />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/policies/:slug" element={<PolicyPage />} />
      </Route>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders type="purchase" />} />
        <Route path="rentals" element={<AdminOrders type="rental" />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="offers" element={<AdminOffers />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function PolicyPage() {
  const slug = window.location.pathname.split("/").pop();
  return <Policies slug={slug} />;
}

export default function App() {
  useEffect(() => { document.title = "Sejal Creation — Imitation Jewellery & Bridal Rentals"; }, []);
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AuthModalProvider>
            <AppRouter />
            <Toaster position="top-center" richColors />
          </AuthModalProvider>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
