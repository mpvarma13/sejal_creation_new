from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import secrets
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import bcrypt
import jwt
import httpx
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# -----------------------------------------------------------------------------
# Setup
# -----------------------------------------------------------------------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"
WHATSAPP = os.environ.get("WHATSAPP_NUMBER", "917262080228")
COD_PIN = os.environ.get("COD_PINCODE", "443101")
BUSINESS_EMAIL = os.environ.get("BUSINESS_EMAIL", "sejalcreation@gmail.com")

app = FastAPI(title="Sejal Creation API")
api = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sejal")


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
def now_utc():
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.isoformat()


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_token(user_id: str, role: str, days: int = 7) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": now_utc() + timedelta(days=days),
        "iat": now_utc(),
    }
    return jwt.encode(payload, jwt_secret(), algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, jwt_secret(), algorithms=[JWT_ALGORITHM])


async def get_user_optional(request: Request) -> Optional[dict]:
    token = None
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
    if not token:
        token = request.cookies.get("session_token")
    if not token:
        return None
    try:
        payload = decode_token(token)
    except Exception:
        return None
    user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    return user


async def get_current_user(request: Request) -> dict:
    user = await get_user_optional(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


async def get_admin_user(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def clean(doc: dict) -> dict:
    if not doc:
        return doc
    doc.pop("_id", None)
    doc.pop("password_hash", None)
    return doc


# -----------------------------------------------------------------------------
# Models
# -----------------------------------------------------------------------------
class RegisterBody(BaseModel):
    name: str
    phone: str
    password: str
    email: Optional[str] = None


class LoginBody(BaseModel):
    identifier: str  # email or username
    password: str


class ProductBody(BaseModel):
    name: str
    description: str = ""
    category: str
    price: float
    rental_price: Optional[float] = None
    security_deposit: Optional[float] = None
    stock: int = 0
    is_rental: bool = False
    is_featured: bool = False
    is_new: bool = False
    images: List[str] = []
    tags: List[str] = []


class CartItemBody(BaseModel):
    product_id: str
    quantity: int = 1


class AddressBody(BaseModel):
    full_name: str
    phone: str
    line1: str
    line2: Optional[str] = ""
    city: str
    state: str
    pincode: str
    landmark: Optional[str] = ""


class CheckoutBody(BaseModel):
    address: AddressBody
    payment_method: Literal["cod", "qr"]
    items: List[CartItemBody]
    payment_proof: Optional[str] = None  # base64 image
    coupon_code: Optional[str] = None
    notes: Optional[str] = ""


class RentalBookingBody(BaseModel):
    product_id: str
    start_date: str
    end_date: str
    address: AddressBody
    payment_proof: Optional[str] = None


class ReviewBody(BaseModel):
    product_id: str
    rating: int = Field(ge=1, le=5)
    comment: str


class StatusUpdateBody(BaseModel):
    status: str


class GoogleSessionBody(BaseModel):
    session_id: str


# -----------------------------------------------------------------------------
# Startup
# -----------------------------------------------------------------------------
DEMO_PRODUCTS = [
    # Bridal Sets
    {"name": "Maharani Royal Bridal Set", "category": "Bridal Sets", "price": 8499, "rental_price": 2499, "security_deposit": 8000, "is_rental": True, "is_featured": True,
     "images": ["https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=900","https://images.pexels.com/photos/13924051/pexels-photo-13924051.jpeg?w=900"],
     "description": "Complete bridal set with necklace, maang tikka, earrings and nath. Heavy kundan & pearl work."},
    {"name": "Rajwadi Polki Bridal Set", "category": "Bridal Sets", "price": 9999, "rental_price": 2999, "security_deposit": 10000, "is_rental": True, "is_featured": True,
     "images": ["https://images.pexels.com/photos/35059564/pexels-photo-35059564.jpeg?w=900"],
     "description": "Statement polki & ruby bridal ensemble for the regal bride."},
    # Necklace Sets
    {"name": "Antique Gold Choker Set", "category": "Necklace Sets", "price": 1899, "is_new": True, "is_featured": True,
     "images": ["https://images.pexels.com/photos/13924051/pexels-photo-13924051.jpeg?w=900"],
     "description": "Antique finish choker with matching earrings."},
    {"name": "Temple Lakshmi Necklace", "category": "Necklace Sets", "price": 2299,
     "images": ["https://images.unsplash.com/photo-1611107683227-e9060eccd846?w=900"],
     "description": "South-Indian temple motif necklace set."},
    # Earrings
    {"name": "Jhumka Pearl Drop Earrings", "category": "Earrings", "price": 599, "is_new": True,
     "images": ["https://images.unsplash.com/photo-1651160670627-2896ddf7822f?w=900"],
     "description": "Traditional jhumka with pearl drops."},
    {"name": "Chandbali Kundan Earrings", "category": "Earrings", "price": 849,
     "images": ["https://images.pexels.com/photos/37601639/pexels-photo-37601639.jpeg?w=900"],
     "description": "Crescent shaped kundan chandbali earrings."},
    # Bangles
    {"name": "Rose Gold Kada Pair", "category": "Bangles", "price": 1199, "is_featured": True,
     "images": ["https://images.pexels.com/photos/37485309/pexels-photo-37485309.jpeg?w=900"],
     "description": "Rose gold finish broad kada — pair of 2."},
    {"name": "Meenakari Bangle Set (4 pcs)", "category": "Bangles", "price": 999,
     "images": ["https://images.pexels.com/photos/37485309/pexels-photo-37485309.jpeg?w=900"],
     "description": "Vibrant meenakari work bangles set of 4."},
    # Mangalsutra
    {"name": "Classic Black Bead Mangalsutra", "category": "Mangalsutra", "price": 799,
     "images": ["https://images.unsplash.com/photo-1611107683227-e9060eccd846?w=900"],
     "description": "Daily wear mangalsutra with diamond-look pendant."},
    # Maang Tikka
    {"name": "Kundan Maang Tikka", "category": "Maang Tikka", "price": 549, "is_new": True,
     "images": ["https://images.pexels.com/photos/13924051/pexels-photo-13924051.jpeg?w=900"],
     "description": "Bridal kundan maang tikka with pearl drops."},
    # Rings
    {"name": "Adjustable Floral Ring", "category": "Rings", "price": 299,
     "images": ["https://images.unsplash.com/photo-1611107683227-e9060eccd846?w=900"],
     "description": "Adjustable floral ring in gold finish."},
    # Anklets
    {"name": "Silver Look Payal Pair", "category": "Anklets", "price": 449,
     "images": ["https://images.pexels.com/photos/37485309/pexels-photo-37485309.jpeg?w=900"],
     "description": "Oxidised silver-look anklets with ghungroo."},
    # Combo
    {"name": "Festive Combo (Necklace + Earrings + Bangles)", "category": "Combo Sets", "price": 1999, "is_featured": True,
     "images": ["https://images.pexels.com/photos/13924051/pexels-photo-13924051.jpeg?w=900"],
     "description": "All-in-one festive combo."},
    # Wedding
    {"name": "Heavy Reception Jewellery Set", "category": "Wedding Collections", "price": 3499, "rental_price": 1299, "security_deposit": 3500, "is_rental": True,
     "images": ["https://images.pexels.com/photos/35059564/pexels-photo-35059564.jpeg?w=900"],
     "description": "Heavy reception look set — also available on rent."},
    # Party Wear
    {"name": "Crystal Party Necklace", "category": "Party Wear Jewellery", "price": 1299, "is_new": True,
     "images": ["https://images.unsplash.com/photo-1611107683227-e9060eccd846?w=900"],
     "description": "Sparkling crystal necklace for parties."},
    # Traditional
    {"name": "Traditional Rani Haar", "category": "Traditional Jewellery", "price": 2799,
     "images": ["https://images.pexels.com/photos/13924051/pexels-photo-13924051.jpeg?w=900"],
     "description": "Long traditional rani haar with matching earrings."},
    # Premium
    {"name": "Premium Polki Diamond-Look Set", "category": "Premium Collections", "price": 4999, "is_featured": True,
     "images": ["https://images.pexels.com/photos/35059564/pexels-photo-35059564.jpeg?w=900"],
     "description": "Premium polki diamond-look statement set."},
]


async def seed_admin():
    admin_email = os.environ["ADMIN_EMAIL"]
    admin_username = os.environ["ADMIN_USERNAME"]
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "name": "Sejal Admin",
            "email": admin_email,
            "username": admin_username,
            "password_hash": hash_password(admin_password),
            "phone": "",
            "role": "admin",
            "created_at": iso(now_utc()),
        })
        logger.info("Admin user seeded")
    else:
        if not verify_password(admin_password, existing.get("password_hash", "")):
            await db.users.update_one(
                {"email": admin_email},
                {"$set": {"password_hash": hash_password(admin_password), "username": admin_username, "role": "admin"}}
            )


async def seed_products():
    if await db.products.count_documents({}) > 0:
        return
    for p in DEMO_PRODUCTS:
        doc = {
            "product_id": f"SC{uuid.uuid4().hex[:8].upper()}",
            "name": p["name"],
            "description": p.get("description", ""),
            "category": p["category"],
            "price": p["price"],
            "rental_price": p.get("rental_price"),
            "security_deposit": p.get("security_deposit"),
            "stock": p.get("stock", 25),
            "is_rental": p.get("is_rental", False),
            "is_featured": p.get("is_featured", False),
            "is_new": p.get("is_new", False),
            "images": p["images"],
            "tags": p.get("tags", []),
            "rating": 4.5,
            "review_count": 0,
            "created_at": iso(now_utc()),
        }
        await db.products.insert_one(doc)
    logger.info("Seeded %d products", len(DEMO_PRODUCTS))


async def seed_banner():
    if await db.content.count_documents({"key": "homepage"}) > 0:
        return
    await db.content.insert_one({
        "key": "homepage",
        "promo_text": "Free Shipping above ₹999 • Cash on Delivery available in PIN 443101 • Bridal Sets on Rent",
        "hero_title": "Adorn Your Story",
        "hero_subtitle": "Hand-crafted imitation jewellery & bridal sets on rent",
        "updated_at": iso(now_utc()),
    })


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.products.create_index("product_id", unique=True)
    await db.products.create_index("category")
    await seed_admin()
    await seed_products()
    await seed_banner()


# -----------------------------------------------------------------------------
# Auth Routes
# -----------------------------------------------------------------------------
@api.post("/auth/register")
async def register(body: RegisterBody):
    phone = body.phone.strip()
    if not phone or len(phone) < 8:
        raise HTTPException(status_code=400, detail="Valid mobile number required")
    if await db.users.find_one({"phone": phone}):
        raise HTTPException(status_code=400, detail="Mobile number already registered")
    email = (body.email or f"{phone}@sejal.local").lower()
    user = {
        "user_id": f"user_{uuid.uuid4().hex[:12]}",
        "name": body.name,
        "email": email,
        "username": phone,
        "phone": phone,
        "password_hash": hash_password(body.password),
        "role": "customer",
        "addresses": [],
        "created_at": iso(now_utc()),
    }
    await db.users.insert_one(user)
    token = create_token(user["user_id"], "customer")
    return {"token": token, "user": clean({**user})}


@api.post("/auth/login")
async def login(body: LoginBody):
    raw = body.identifier.strip()
    ident = raw.lower()
    user = await db.users.find_one({"$or": [{"phone": raw}, {"email": ident}, {"username": raw}, {"username": ident}]})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["user_id"], user.get("role", "customer"))
    return {"token": token, "user": clean({**user})}


@api.post("/auth/admin-login")
async def admin_login(body: LoginBody):
    ident = body.identifier.lower().strip()
    user = await db.users.find_one({"$or": [{"email": ident}, {"username": ident}]})
    if not user or user.get("role") != "admin" or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    token = create_token(user["user_id"], "admin")
    return {"token": token, "user": clean({**user})}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


@api.post("/auth/google-session")
async def google_session(body: GoogleSessionBody, response: Response):
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": body.session_id},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    data = r.json()
    email = data["email"].lower()
    user = await db.users.find_one({"email": email})
    if not user:
        user = {
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "name": data.get("name", email.split("@")[0]),
            "email": email,
            "username": email.split("@")[0],
            "password_hash": hash_password(secrets.token_urlsafe(24)),
            "phone": "",
            "role": "customer",
            "picture": data.get("picture", ""),
            "google_id": data.get("id"),
            "created_at": iso(now_utc()),
        }
        await db.users.insert_one(user)
    token = create_token(user["user_id"], user.get("role", "customer"))
    response.set_cookie("session_token", token, httponly=False, secure=True, samesite="none", max_age=7*24*3600, path="/")
    return {"token": token, "user": clean({**user})}


# -----------------------------------------------------------------------------
# Products
# -----------------------------------------------------------------------------
@api.get("/products")
async def list_products(
    category: Optional[str] = None,
    is_rental: Optional[bool] = None,
    is_featured: Optional[bool] = None,
    is_new: Optional[bool] = None,
    search: Optional[str] = None,
    sort: Optional[str] = "newest",
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    limit: int = 100,
):
    q = {}
    if category and category != "All":
        q["category"] = category
    if is_rental is not None:
        q["is_rental"] = is_rental
    if is_featured is not None:
        q["is_featured"] = is_featured
    if is_new is not None:
        q["is_new"] = is_new
    if search:
        q["name"] = {"$regex": search, "$options": "i"}
    if min_price is not None or max_price is not None:
        price_q = {}
        if min_price is not None:
            price_q["$gte"] = min_price
        if max_price is not None:
            price_q["$lte"] = max_price
        q["price"] = price_q
    sort_map = {
        "price_low": [("price", 1)],
        "price_high": [("price", -1)],
        "newest": [("created_at", -1)],
        "rating": [("rating", -1)],
    }
    cursor = db.products.find(q, {"_id": 0}).sort(sort_map.get(sort, sort_map["newest"])).limit(limit)
    return await cursor.to_list(length=limit)


@api.get("/products/{product_id}")
async def get_product(product_id: str):
    p = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Product not found")
    related = await db.products.find(
        {"category": p["category"], "product_id": {"$ne": product_id}}, {"_id": 0}
    ).limit(6).to_list(6)
    reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)
    return {"product": p, "related": related, "reviews": reviews}


@api.post("/products", dependencies=[Depends(get_admin_user)])
async def create_product(body: ProductBody):
    doc = {
        "product_id": f"SC{uuid.uuid4().hex[:8].upper()}",
        **body.model_dump(),
        "rating": 0,
        "review_count": 0,
        "created_at": iso(now_utc()),
    }
    await db.products.insert_one(doc)
    return clean(doc)


@api.put("/products/{product_id}", dependencies=[Depends(get_admin_user)])
async def update_product(product_id: str, body: ProductBody):
    res = await db.products.update_one({"product_id": product_id}, {"$set": body.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(404, "Not found")
    p = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    return p


@api.delete("/products/{product_id}", dependencies=[Depends(get_admin_user)])
async def delete_product(product_id: str):
    await db.products.delete_one({"product_id": product_id})
    return {"ok": True}


@api.get("/categories")
async def categories():
    cats = [
        "Bridal Sets", "Necklace Sets", "Earrings", "Bangles", "Mangalsutra",
        "Maang Tikka", "Rings", "Anklets", "Combo Sets", "Wedding Collections",
        "Party Wear Jewellery", "Traditional Jewellery", "Premium Collections", "New Arrivals"
    ]
    return cats


# -----------------------------------------------------------------------------
# Reviews
# -----------------------------------------------------------------------------
@api.post("/reviews")
async def add_review(body: ReviewBody, user: dict = Depends(get_current_user)):
    doc = {
        "review_id": f"rev_{uuid.uuid4().hex[:10]}",
        "product_id": body.product_id,
        "user_id": user["user_id"],
        "user_name": user["name"],
        "rating": body.rating,
        "comment": body.comment,
        "created_at": iso(now_utc()),
    }
    await db.reviews.insert_one(doc)
    # update product rating
    revs = await db.reviews.find({"product_id": body.product_id}).to_list(1000)
    avg = sum(r["rating"] for r in revs) / max(len(revs), 1)
    await db.products.update_one({"product_id": body.product_id}, {"$set": {"rating": round(avg, 2), "review_count": len(revs)}})
    return clean(doc)


# -----------------------------------------------------------------------------
# Wishlist & Cart (server-side for authenticated users)
# -----------------------------------------------------------------------------
@api.get("/wishlist")
async def get_wishlist(user: dict = Depends(get_current_user)):
    items = await db.wishlists.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(500)
    pids = [i["product_id"] for i in items]
    products = await db.products.find({"product_id": {"$in": pids}}, {"_id": 0}).to_list(500)
    return products


@api.post("/wishlist/{product_id}")
async def add_wishlist(product_id: str, user: dict = Depends(get_current_user)):
    await db.wishlists.update_one(
        {"user_id": user["user_id"], "product_id": product_id},
        {"$set": {"user_id": user["user_id"], "product_id": product_id, "created_at": iso(now_utc())}},
        upsert=True,
    )
    return {"ok": True}


@api.delete("/wishlist/{product_id}")
async def remove_wishlist(product_id: str, user: dict = Depends(get_current_user)):
    await db.wishlists.delete_one({"user_id": user["user_id"], "product_id": product_id})
    return {"ok": True}


# -----------------------------------------------------------------------------
# Orders & Checkout
# -----------------------------------------------------------------------------
def calc_totals(items: List[dict], coupon: Optional[dict] = None):
    subtotal = sum(i["price"] * i["quantity"] for i in items)
    shipping = 0 if subtotal >= 999 else 80
    discount = 0
    if coupon:
        if coupon.get("type") == "percent":
            discount = subtotal * coupon["value"] / 100
        else:
            discount = coupon["value"]
    total = max(0, subtotal + shipping - discount)
    return subtotal, shipping, discount, total


@api.post("/checkout/preview")
async def checkout_preview(body: CheckoutBody):
    items = []
    for it in body.items:
        p = await db.products.find_one({"product_id": it.product_id}, {"_id": 0})
        if not p:
            continue
        items.append({"product_id": p["product_id"], "name": p["name"], "price": p["price"], "quantity": it.quantity, "image": p["images"][0] if p["images"] else ""})
    coupon = None
    if body.coupon_code:
        coupon = await db.coupons.find_one({"code": body.coupon_code.upper(), "active": True}, {"_id": 0})
    subtotal, shipping, discount, total = calc_totals(items, coupon)
    cod_available = body.address.pincode == COD_PIN
    return {
        "items": items, "subtotal": subtotal, "shipping": shipping,
        "discount": discount, "total": total,
        "cod_available": cod_available, "cod_pincode": COD_PIN,
        "coupon": coupon,
    }


@api.get("/check-pincode")
async def check_pincode(pincode: str):
    return {"pincode": pincode, "cod_available": pincode == COD_PIN, "cod_pincode": COD_PIN}


@api.post("/orders")
async def place_order(body: CheckoutBody, request: Request):
    user = await get_user_optional(request)
    items = []
    for it in body.items:
        p = await db.products.find_one({"product_id": it.product_id}, {"_id": 0})
        if not p:
            raise HTTPException(400, f"Product not found: {it.product_id}")
        items.append({
            "product_id": p["product_id"], "name": p["name"], "price": p["price"],
            "quantity": it.quantity, "image": p["images"][0] if p["images"] else ""
        })
    if not items:
        raise HTTPException(400, "No items")
    coupon = None
    if body.coupon_code:
        coupon = await db.coupons.find_one({"code": body.coupon_code.upper(), "active": True}, {"_id": 0})
    subtotal, shipping, discount, total = calc_totals(items, coupon)

    if body.payment_method == "cod" and body.address.pincode != COD_PIN:
        raise HTTPException(400, f"COD only available for PIN {COD_PIN}")

    status = "Order Confirmed" if body.payment_method == "cod" else "Payment Verification Pending"
    order = {
        "order_id": f"SC-{datetime.now().strftime('%y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
        "user_id": user["user_id"] if user else None,
        "customer_name": body.address.full_name,
        "customer_phone": body.address.phone,
        "customer_email": user["email"] if user else "",
        "items": items,
        "subtotal": subtotal, "shipping": shipping, "discount": discount, "total": total,
        "address": body.address.model_dump(),
        "payment_method": body.payment_method,
        "payment_proof": body.payment_proof,
        "coupon_code": body.coupon_code,
        "status": status,
        "tracking": [{"status": status, "at": iso(now_utc())}],
        "notes": body.notes or "",
        "type": "purchase",
        "created_at": iso(now_utc()),
    }
    await db.orders.insert_one(order)
    return clean(order)


@api.get("/orders/my")
async def my_orders(user: dict = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return orders


@api.get("/orders/{order_id}")
async def get_order(order_id: str):
    o = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not o:
        raise HTTPException(404, "Order not found")
    return o


# Rental booking
@api.post("/rentals")
async def book_rental(body: RentalBookingBody, request: Request):
    user = await get_user_optional(request)
    p = await db.products.find_one({"product_id": body.product_id}, {"_id": 0})
    if not p or not p.get("is_rental"):
        raise HTTPException(400, "Product not available for rental")
    booking = {
        "order_id": f"RNT-{datetime.now().strftime('%y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
        "type": "rental",
        "user_id": user["user_id"] if user else None,
        "product": {"product_id": p["product_id"], "name": p["name"], "image": p["images"][0] if p["images"] else ""},
        "rental_price": p["rental_price"],
        "security_deposit": p.get("security_deposit", 0),
        "start_date": body.start_date,
        "end_date": body.end_date,
        "address": body.address.model_dump(),
        "customer_name": body.address.full_name,
        "customer_phone": body.address.phone,
        "payment_proof": body.payment_proof,
        "total": (p["rental_price"] or 0) + (p.get("security_deposit") or 0),
        "status": "Payment Verification Pending" if body.payment_proof else "Booking Requested",
        "tracking": [{"status": "Booking Requested", "at": iso(now_utc())}],
        "created_at": iso(now_utc()),
    }
    await db.orders.insert_one(booking)
    return clean(booking)


# -----------------------------------------------------------------------------
# Admin
# -----------------------------------------------------------------------------
@api.get("/admin/dashboard", dependencies=[Depends(get_admin_user)])
async def admin_dashboard():
    today = datetime.now().strftime("%Y-%m-%d")
    month = datetime.now().strftime("%Y-%m")
    all_orders = await db.orders.find({}, {"_id": 0}).to_list(5000)
    total_sales = sum(o["total"] for o in all_orders if o.get("type") == "purchase")
    today_sales = sum(o["total"] for o in all_orders if o.get("type") == "purchase" and o.get("created_at", "").startswith(today))
    month_sales = sum(o["total"] for o in all_orders if o.get("type") == "purchase" and o.get("created_at", "").startswith(month))
    rental_revenue = sum(o.get("rental_price", 0) for o in all_orders if o.get("type") == "rental")
    pending = sum(1 for o in all_orders if "Pending" in o.get("status", ""))
    customers = await db.users.count_documents({"role": "customer"})
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    low_stock = [p for p in products if p.get("stock", 0) < 5]
    # Best selling
    name_count = {}
    for o in all_orders:
        for it in o.get("items", []):
            name_count[it["name"]] = name_count.get(it["name"], 0) + it["quantity"]
    best = sorted(name_count.items(), key=lambda x: -x[1])[:5]
    # Sales last 7 days
    sales_7d = []
    for i in range(6, -1, -1):
        d = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        s = sum(o["total"] for o in all_orders if o.get("created_at", "").startswith(d))
        sales_7d.append({"date": d[5:], "sales": s})
    return {
        "total_sales": total_sales, "today_sales": today_sales, "month_sales": month_sales,
        "rental_revenue": rental_revenue, "total_orders": len(all_orders), "pending_orders": pending,
        "total_customers": customers, "total_products": len(products),
        "low_stock": low_stock[:10], "best_selling": [{"name": n, "qty": q} for n, q in best],
        "sales_7d": sales_7d,
    }


@api.get("/admin/orders", dependencies=[Depends(get_admin_user)])
async def admin_orders(status: Optional[str] = None, type_: Optional[str] = Query(None, alias="type")):
    q = {}
    if status:
        q["status"] = status
    if type_:
        q["type"] = type_
    orders = await db.orders.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return orders


@api.put("/admin/orders/{order_id}/status", dependencies=[Depends(get_admin_user)])
async def update_order_status(order_id: str, body: StatusUpdateBody):
    o = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not o:
        raise HTTPException(404, "Not found")
    tracking = o.get("tracking", [])
    tracking.append({"status": body.status, "at": iso(now_utc())})
    await db.orders.update_one({"order_id": order_id}, {"$set": {"status": body.status, "tracking": tracking}})
    return {"ok": True, "status": body.status}


@api.get("/admin/customers", dependencies=[Depends(get_admin_user)])
async def admin_customers():
    users = await db.users.find({"role": "customer"}, {"_id": 0, "password_hash": 0}).to_list(2000)
    for u in users:
        u["order_count"] = await db.orders.count_documents({"user_id": u["user_id"]})
    return users


@api.get("/admin/content")
async def get_content():
    c = await db.content.find_one({"key": "homepage"}, {"_id": 0})
    return c or {}


@api.put("/admin/content", dependencies=[Depends(get_admin_user)])
async def update_content(body: dict):
    body["updated_at"] = iso(now_utc())
    await db.content.update_one({"key": "homepage"}, {"$set": body}, upsert=True)
    return await db.content.find_one({"key": "homepage"}, {"_id": 0})


@api.get("/config")
async def public_config():
    offers = await db.coupons.find({"active": True, "public": True}, {"_id": 0}).to_list(20)
    return {
        "whatsapp": WHATSAPP,
        "email": BUSINESS_EMAIL,
        "cod_pincode": COD_PIN,
        "offers": offers,
    }


# ---------- Addresses ----------
@api.get("/me/addresses")
async def get_addresses(user: dict = Depends(get_current_user)):
    u = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    return u.get("addresses", [])


@api.post("/me/addresses")
async def save_address(body: AddressBody, user: dict = Depends(get_current_user)):
    addr = body.model_dump()
    addr["address_id"] = f"addr_{uuid.uuid4().hex[:8]}"
    addr["created_at"] = iso(now_utc())
    await db.users.update_one({"user_id": user["user_id"]}, {"$push": {"addresses": addr}})
    return addr


@api.delete("/me/addresses/{address_id}")
async def del_address(address_id: str, user: dict = Depends(get_current_user)):
    await db.users.update_one({"user_id": user["user_id"]}, {"$pull": {"addresses": {"address_id": address_id}}})
    return {"ok": True}


# ---------- Coupons / Offers ----------
class CouponBody(BaseModel):
    code: str
    type: Literal["percent", "flat"]
    value: float
    description: str = ""
    min_order: float = 0
    active: bool = True
    public: bool = True


@api.get("/admin/coupons", dependencies=[Depends(get_admin_user)])
async def list_coupons():
    return await db.coupons.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)


@api.post("/admin/coupons", dependencies=[Depends(get_admin_user)])
async def create_coupon(body: CouponBody):
    code = body.code.upper().strip()
    if await db.coupons.find_one({"code": code}):
        raise HTTPException(400, "Coupon code already exists")
    doc = {**body.model_dump(), "code": code, "coupon_id": f"cpn_{uuid.uuid4().hex[:8]}", "created_at": iso(now_utc())}
    await db.coupons.insert_one(doc)
    return clean(doc)


@api.put("/admin/coupons/{coupon_id}", dependencies=[Depends(get_admin_user)])
async def update_coupon(coupon_id: str, body: CouponBody):
    upd = body.model_dump()
    upd["code"] = upd["code"].upper().strip()
    res = await db.coupons.update_one({"coupon_id": coupon_id}, {"$set": upd})
    if res.matched_count == 0:
        raise HTTPException(404, "Not found")
    return await db.coupons.find_one({"coupon_id": coupon_id}, {"_id": 0})


@api.delete("/admin/coupons/{coupon_id}", dependencies=[Depends(get_admin_user)])
async def del_coupon(coupon_id: str):
    await db.coupons.delete_one({"coupon_id": coupon_id})
    return {"ok": True}


@api.get("/coupons/{code}")
async def get_coupon(code: str):
    c = await db.coupons.find_one({"code": code.upper().strip(), "active": True}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Invalid or inactive coupon")
    return c


app.include_router(api)


@app.get("/")
async def root():
    return {"app": "Sejal Creation API", "status": "running"}


@app.on_event("shutdown")
async def shutdown():
    client.close()
