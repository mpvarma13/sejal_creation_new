import { whatsAppChatLink } from "@/lib/api";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Contact() {
  return (
    <div className="px-4 sm:px-6 lg:px-12 py-16 max-w-4xl mx-auto" data-testid="contact-page">
      <div className="text-center mb-12">
        <p className="text-xs uppercase tracking-[0.3em] text-deep-gold">Get in Touch</p>
        <h1 className="font-serif text-3xl sm:text-5xl mt-2">Contact Us</h1>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="admin-card text-center">
          <Phone className="mx-auto text-deep-gold" />
          <h4 className="font-serif mt-3">WhatsApp</h4>
          <a href={whatsAppChatLink()} target="_blank" rel="noreferrer" className="link-gold text-sm mt-2 inline-block">+91 72620 80228</a>
        </div>
        <div className="admin-card text-center">
          <Mail className="mx-auto text-deep-gold" />
          <h4 className="font-serif mt-3">Email</h4>
          <a href="mailto:sejalcreation@gmail.com" className="link-gold text-sm mt-2 inline-block">sejalcreation@gmail.com</a>
        </div>
        <div className="admin-card text-center">
          <MapPin className="mx-auto text-deep-gold" />
          <h4 className="font-serif mt-3">Store</h4>
          <p className="text-sm mt-2 text-text-muted">Maharashtra, India</p>
        </div>
      </div>
      <div className="text-center mt-10">
        <a href={whatsAppChatLink()} target="_blank" rel="noreferrer" className="btn-whatsapp inline-flex"><i className="fa-brands fa-whatsapp text-lg" /> Chat on WhatsApp</a>
      </div>
    </div>
  );
}
