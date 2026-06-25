import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("sc_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default api;

export const WHATSAPP_DEFAULT = "917262080228";

export function buildWhatsAppOrderLink({ phone = WHATSAPP_DEFAULT, productName, productId, price, quantity = 1, productUrl }) {
  const msg = `Hello Sejal Creation,\nI want to order the following product:\n\nProduct Name: ${productName}\nProduct ID: ${productId}\nPrice: ₹${price}\nQuantity: ${quantity}\nLink: ${productUrl}\n\nPlease confirm availability.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

export function whatsAppChatLink(phone = WHATSAPP_DEFAULT, message = "Hello Sejal Creation,") {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function formatINR(n) {
  if (n == null) return "—";
  return "₹" + Number(n).toLocaleString("en-IN");
}
