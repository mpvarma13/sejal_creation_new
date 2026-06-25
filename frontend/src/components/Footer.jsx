import { Link } from "react-router-dom";
import { Mail, Phone, MessageCircle, Instagram, Facebook } from "lucide-react";
import { whatsAppChatLink } from "@/lib/api";

export default function Footer() {
  return (
    <footer className="bg-[#1A1814] text-[#E5E0D8] mt-24" data-testid="site-footer">
      <div className="px-4 sm:px-6 lg:px-12 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="font-display text-3xl text-gold">Sejal ✦ Creation</div>
          <p className="text-sm mt-4 leading-relaxed opacity-80">Hand-crafted imitation jewellery and bridal sets on rent. Premium quality, traditional designs, modern service.</p>
          <div className="flex gap-4 mt-5">
            <a href="#" className="hover:text-gold" data-testid="footer-instagram"><Instagram size={18} /></a>
            <a href="#" className="hover:text-gold" data-testid="footer-facebook"><Facebook size={18} /></a>
            <a href={whatsAppChatLink()} target="_blank" rel="noreferrer" className="hover:text-gold" data-testid="footer-whatsapp"><MessageCircle size={18} /></a>
          </div>
        </div>
        <div>
          <h4 className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Shop</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li><Link to="/shop">All Jewellery</Link></li>
            <li><Link to="/shop?category=Bridal%20Sets">Bridal Sets</Link></li>
            <li><Link to="/shop?category=Necklace%20Sets">Necklace Sets</Link></li>
            <li><Link to="/shop?category=Earrings">Earrings</Link></li>
            <li><Link to="/rental">Bridal Rentals</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Policies</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li><Link to="/policies/about">About Us</Link></li>
            <li><Link to="/policies/privacy">Privacy Policy</Link></li>
            <li><Link to="/policies/terms">Terms & Conditions</Link></li>
            <li><Link to="/policies/shipping">Shipping Policy</Link></li>
            <li><Link to="/policies/refund">Refund Policy</Link></li>
            <li><Link to="/policies/rental">Rental Policy</Link></li>
            <li><Link to="/policies/faq">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Contact</h4>
          <ul className="space-y-3 text-sm opacity-80">
            <li className="flex items-center gap-2"><Phone size={14} /> +91 72620 80228</li>
            <li className="flex items-center gap-2"><Mail size={14} /> sejalcreation@gmail.com</li>
            <li className="flex items-center gap-2"><MessageCircle size={14} /> WhatsApp orders 24×7</li>
          </ul>
          <a href={whatsAppChatLink()} target="_blank" rel="noreferrer" className="btn-whatsapp mt-5 inline-flex" data-testid="footer-whatsapp-btn">
            <i className="fa-brands fa-whatsapp" /> Chat on WhatsApp
          </a>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs opacity-70">© {new Date().getFullYear()} Sejal Creation. All rights reserved.</div>
    </footer>
  );
}
