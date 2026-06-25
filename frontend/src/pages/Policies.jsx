export default function Policies({ slug }) {
  const content = CONTENT[slug] || CONTENT.about;
  return (
    <div className="px-4 sm:px-6 lg:px-12 py-16 max-w-3xl mx-auto" data-testid={`policy-${slug}`}>
      <h1 className="font-serif text-3xl sm:text-4xl">{content.title}</h1>
      <div className="divider-ornament my-6" />
      <div className="space-y-4 text-text-secondary text-sm leading-relaxed whitespace-pre-line">{content.body}</div>
    </div>
  );
}

const CONTENT = {
  about: { title: "About Us", body: `Sejal Creation curates premium imitation jewellery and bridal sets — both for purchase and on rent.\n\nFrom heirloom-style polki sets to everyday mangalsutra, every piece is hand-finished and inspected before reaching you. We believe royal style shouldn't carry a royal price tag.\n\nBased in Maharashtra, we ship pan-India and accept WhatsApp orders 24×7.` },
  privacy: { title: "Privacy Policy", body: `We collect only the information necessary to process your order — name, contact, address, and payment proof.\n\nWe do not sell your data. Payment screenshots are stored securely and used only for verification.` },
  terms: { title: "Terms & Conditions", body: `By placing an order on Sejal Creation, you agree to provide accurate information and complete payment as agreed. All products are imitation jewellery unless otherwise stated.` },
  shipping: { title: "Shipping Policy", body: `Free shipping on orders above ₹999.\nShipping charge: ₹80 for orders below ₹999.\nDispatched within 1-2 business days.\nDelivery: 3-7 business days across India.\nCOD: Available only for PIN 443101.` },
  refund: { title: "Refund Policy", body: `Refunds/exchanges accepted within 7 days for unused items in original packaging.\nCustom or rented items are non-refundable.\nRefunds are processed within 5-7 business days.` },
  rental: { title: "Rental Policy", body: `Rental duration: 4 days standard.\nSecurity deposit is refundable upon safe return of jewellery.\nDamage/loss will be deducted from the deposit.\nBookings via WhatsApp +91 72620 80228 or our website.\nID proof required for rental.` },
  faq: { title: "FAQ", body: `Q: Is COD available?\nA: Only for PIN 443101.\n\nQ: How do I pay online?\nA: Scan our UPI QR, pay, and upload screenshot at checkout.\n\nQ: Can I rent a bridal set?\nA: Yes! Visit our Rental section.\n\nQ: How do I order on WhatsApp?\nA: Click the WhatsApp button on any product — message auto-populates.` },
};
