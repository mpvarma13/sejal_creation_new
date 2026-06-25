import { whatsAppChatLink } from "@/lib/api";

export default function WhatsAppFloat() {
  return (
    <a
      href={whatsAppChatLink()}
      target="_blank"
      rel="noreferrer"
      data-testid="whatsapp-float-btn"
      className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 bg-[#25D366] text-white w-14 h-14 rounded-full shadow-xl hover:scale-110 transition-transform z-40 flex items-center justify-center"
      aria-label="WhatsApp"
    >
      <i className="fa-brands fa-whatsapp text-2xl" />
    </a>
  );
}
