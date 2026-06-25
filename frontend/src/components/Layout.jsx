import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileNav from "@/components/MobileNav";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <>
      <Header />
      <main className="min-h-[60vh] pb-16 lg:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
      <WhatsAppFloat />
    </>
  );
}
