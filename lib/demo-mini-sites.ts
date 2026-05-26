export type DemoItem = {
  name: string;
  description?: string;
  price?: string;
  meta?: string;
  badge?: string;
  imageTone?: string;
};

export type DemoMiniSite = {
  slug: string;
  brandLine: string;
  heroTitle: string;
  heroText: string;
  nav: string[];
  primaryAction: string;
  secondaryAction: string;
  categories: string[];
  itemsTitle: string;
  items: DemoItem[];
  servicesTitle: string;
  services: DemoItem[];
  flowTitle: string;
  flowDescription: string;
  flowFields: string[];
  flowSummary: string[];
  checkoutTitle: string;
  checkoutLines: DemoItem[];
  galleryTitle: string;
  gallery: DemoItem[];
  reviews: { name: string; quote: string; detail: string }[];
  promo: string;
  footerLinks: string[];
};

export const demoMiniSites: Record<string, DemoMiniSite> = {
  "crafted-commerce": {
    slug: "crafted-commerce",
    brandLine: "Handmade gifts, vendor drops, and event-ready pickup",
    heroTitle: "Custom crafts that feel personal before checkout.",
    heroText:
      "A boutique maker storefront with real-looking categories, featured items, cart state, pickup/shipping choices, event promotion, and reviews.",
    nav: ["Home", "Shop", "Custom Orders", "Events", "Reviews"],
    primaryAction: "Shop new arrivals",
    secondaryAction: "Start custom order",
    categories: ["Tumblers", "Keychains", "Pens", "Badge reels", "Wristlets", "Custom cups"],
    itemsTitle: "Featured handmade products",
    items: [
      { name: "Glitter Snowglobe Tumbler", description: "Personalized 20oz cup with name decal and sealed sparkle finish.", price: "$34", badge: "Best seller", imageTone: "#D9B8A1" },
      { name: "Resin Letter Keychain", description: "Initial charm with pressed floral detail and gold hardware.", price: "$12", badge: "Customizable", imageTone: "#8DAA91" },
      { name: "Teacher Pen Set", description: "Three beaded pens packed for gifting with refill notes.", price: "$18", meta: "Gift ready", imageTone: "#F7F2EC" },
      { name: "Badge Reel Bundle", description: "Two badge reels with interchangeable acrylic toppers.", price: "$16", meta: "Local pickup", imageTone: "#6B4F43" },
      { name: "Wristlet Strap", description: "Soft clay silicone bead wristlet with tassel and clasp.", price: "$14", imageTone: "#D9B8A1" },
      { name: "Custom Cold Cup", description: "Name, color, and theme selector for quick personalization.", price: "$22", badge: "Made to order", imageTone: "#8DAA91" }
    ],
    servicesTitle: "Vendor tools shown",
    services: [
      { name: "AI product upload", description: "Mock product assistant turns a photo prompt into title, tags, and description.", meta: "Admin preview" },
      { name: "Square checkout concept", description: "Deposit, full payment, pickup, and shipping payment states can be connected.", meta: "Payment ready" },
      { name: "Inventory sync", description: "Vendor mall and event stock can be tracked from one dashboard.", meta: "Operations" }
    ],
    flowTitle: "Cart and pickup preview",
    flowDescription: "A realistic cart drawer with shipping/local pickup selection and checkout summary.",
    flowFields: ["Name personalization", "Color theme", "Pickup or shipping", "Event pickup date"],
    flowSummary: ["3 items in cart", "Local pickup selected", "Square checkout placeholder", "Inventory reserved for 15 min"],
    checkoutTitle: "Crafted cart",
    checkoutLines: [
      { name: "Glitter Snowglobe Tumbler", price: "$34", meta: "Qty 1" },
      { name: "Teacher Pen Set", price: "$18", meta: "Qty 1" },
      { name: "Local pickup", price: "$0", meta: "Saturday vendor event" }
    ],
    galleryTitle: "Upcoming vendor event",
    gallery: [
      { name: "Spring Maker Market", description: "Booth B12, Saturday 10-4, pickup orders available.", meta: "Event banner" },
      { name: "Custom Cup Bar", description: "Choose vinyl, glitter, color, and lid style at the booth.", meta: "Live station" },
      { name: "Ready-to-gift wall", description: "Prewrapped badge reels, wristlets, pens, and keychains.", meta: "Retail display" }
    ],
    reviews: [
      { name: "Maya R.", quote: "The pickup flow made my custom tumbler order feel easy and professional.", detail: "Verified local buyer" },
      { name: "Jenna K.", quote: "I could imagine running my whole vendor table from this dashboard.", detail: "Craft vendor" }
    ],
    promo: "Vendor event preorders close Friday at 8 PM.",
    footerLinks: ["Shop", "Events", "Custom orders", "Pickup policy"]
  },
  "ember-oak": {
    slug: "ember-oak",
    brandLine: "Luxury minimal fashion with seasonal drops",
    heroTitle: "Quiet statement pieces for modern wardrobes.",
    heroText: "A boutique fashion experience with collections, variants, size selection, lookbook storytelling, and newsletter capture.",
    nav: ["Home", "Collections", "Lookbook", "New Arrivals", "Journal"],
    primaryAction: "View collection",
    secondaryAction: "Join the list",
    categories: ["Jackets", "Dresses", "Bags", "Jewelry", "Seasonal edit"],
    itemsTitle: "Fall capsule arrivals",
    items: [
      { name: "Tailored Ash Jacket", description: "Structured cropped jacket with matte black buttons.", price: "$128", badge: "New", imageTone: "#121212" },
      { name: "Ivory Slip Dress", description: "Layerable satin finish dress with adjustable straps.", price: "$94", imageTone: "#F5F2ED" },
      { name: "Olive Market Bag", description: "Soft structured tote with gold hardware.", price: "$76", meta: "Low stock", imageTone: "#4E5B50" },
      { name: "Gold Arc Hoops", description: "Lightweight everyday jewelry with polished finish.", price: "$32", imageTone: "#C8A96B" }
    ],
    servicesTitle: "Shopping details",
    services: [
      { name: "Variant selector", description: "Size, color, inventory, and low-stock notices are modeled in the product UI.", meta: "XS-XL" },
      { name: "Lookbook pages", description: "Editorial layouts connect products to complete outfits.", meta: "Styled" },
      { name: "Newsletter signup", description: "A polished capture section for drops, promos, and VIP previews.", meta: "Lead capture" }
    ],
    flowTitle: "Size and cart preview",
    flowDescription: "A buyer can choose size, preview cart, apply promo, and continue to checkout.",
    flowFields: ["Size selector", "Color variant", "Promo code", "Gift note"],
    flowSummary: ["M selected", "Promo: OAK15", "Free shipping over $150", "Cart preview open"],
    checkoutTitle: "Boutique cart",
    checkoutLines: [
      { name: "Tailored Ash Jacket", price: "$128", meta: "M / Matte black" },
      { name: "Gold Arc Hoops", price: "$32", meta: "One size" },
      { name: "OAK15 promo", price: "-$24", meta: "Applied" }
    ],
    galleryTitle: "Lookbook",
    gallery: [
      { name: "City neutral", description: "Ash jacket, ivory denim, gold hoops.", meta: "Shop the look" },
      { name: "Dinner edit", description: "Slip dress, olive bag, stacked jewelry.", meta: "Evening" },
      { name: "Weekend layer", description: "Oversized knit, structured tote, ankle boots.", meta: "Capsule" }
    ],
    reviews: [
      { name: "Ari S.", quote: "The lookbook makes the store feel like a real boutique brand.", detail: "Returning buyer" },
      { name: "Dana M.", quote: "Variant and cart previews are exactly what my shop needs.", detail: "Boutique owner" }
    ],
    promo: "15% off the fall capsule this weekend only.",
    footerLinks: ["Collections", "Sizing", "Returns", "Newsletter"]
  },
  "velocity-fulfillment": {
    slug: "velocity-fulfillment",
    brandLine: "Fast-moving gadget funnels with conversion systems",
    heroTitle: "Trending tech products with checkout momentum.",
    heroText: "A dropshipping-style commerce funnel with urgency messaging, trust badges, reviews, bundles, sticky cart, and shipping clarity.",
    nav: ["Offer", "Bundles", "Reviews", "Shipping", "FAQ"],
    primaryAction: "Claim bundle",
    secondaryAction: "Read reviews",
    categories: ["Desk upgrades", "Travel", "Charging", "Kitchen tech", "Wellness"],
    itemsTitle: "Trending products",
    items: [
      { name: "Halo LED Desk Lamp", description: "Dimmable task lamp with phone stand and wireless charging base.", price: "$49", badge: "Hot", imageTone: "#2563EB" },
      { name: "MagStack Charger", description: "Fold-flat magnetic travel charger for phone, watch, and earbuds.", price: "$39", meta: "Bundle eligible", imageTone: "#22C55E" },
      { name: "PackRight Organizer", description: "Compression travel organizer with tech pockets.", price: "$29", imageTone: "#E5E7EB" },
      { name: "HydroSmart Bottle", description: "Temperature display bottle with hydration reminder concept.", price: "$34", imageTone: "#111827" },
      { name: "BlendGo Portable Blender", description: "USB-C portable blender for shakes and smoothies.", price: "$45", badge: "Trending", imageTone: "#2563EB" }
    ],
    servicesTitle: "Conversion blocks",
    services: [
      { name: "Urgency banner", description: "Countdown, cart reservation, and low-stock messaging.", meta: "7 left" },
      { name: "Trust badges", description: "Secure checkout, tracked shipping, easy returns, support promise.", meta: "Confidence" },
      { name: "Upsell bundles", description: "Cross-sells and post-cart bundle logic for higher AOV.", meta: "+18%" }
    ],
    flowTitle: "Sticky checkout flow",
    flowDescription: "A high-conversion cart mockup with bundle discounts, quantity breaks, and shipping messaging.",
    flowFields: ["Quantity", "Bundle add-on", "Shipping region", "Protection plan"],
    flowSummary: ["Buy 2 save 12%", "Tracked shipping included", "Order reserved 09:42", "Express processing available"],
    checkoutTitle: "Velocity cart",
    checkoutLines: [
      { name: "Halo LED Desk Lamp", price: "$49", meta: "Qty 1" },
      { name: "MagStack Charger add-on", price: "$29", meta: "Bundle price" },
      { name: "Tracked shipping", price: "$0", meta: "5-8 days" }
    ],
    galleryTitle: "Social proof",
    gallery: [
      { name: "4.8 average rating", description: "Based on 2,418 simulated reviews.", meta: "Reviews" },
      { name: "Secure checkout", description: "Payment and fulfillment states ready to connect.", meta: "Trust" },
      { name: "Ships in 24 hours", description: "Shipping message cards reduce support questions.", meta: "Logistics" }
    ],
    reviews: [
      { name: "Chris P.", quote: "The bundle and urgency sections feel like a real conversion funnel.", detail: "Product operator" },
      { name: "Leah V.", quote: "This is exactly how I want my gadget store to move customers.", detail: "Founder" }
    ],
    promo: "Today only: bundle any charger with the Halo Lamp and save 20%.",
    footerLinks: ["Track order", "Returns", "Shipping", "Support"]
  },
  "petes-kitchen": {
    slug: "petes-kitchen",
    brandLine: "Pizza, wings, catering, and local pickup",
    heroTitle: "Hot pizza orders without the phone chaos.",
    heroText: "A warm restaurant ordering demo with menu categories, order builder, cart summary, pickup time, specials, catering, jobs, hours, and location.",
    nav: ["Menu", "Order Pickup", "Specials", "Catering", "Jobs"],
    primaryAction: "Build an order",
    secondaryAction: "Request catering",
    categories: ["Pizza", "Wings", "Salads", "Desserts", "Drinks"],
    itemsTitle: "Menu favorites",
    items: [
      { name: "Classic Pepperoni Pizza", description: "Red sauce, mozzarella, crisp pepperoni, oregano.", price: "$17.99", badge: "Popular", imageTone: "#C0392B" },
      { name: "Garlic Parm Wings", description: "Ten wings tossed with garlic butter and parmesan.", price: "$13.50", imageTone: "#E0A106" },
      { name: "House Italian Salad", description: "Romaine, olives, peppers, provolone, house vinaigrette.", price: "$9.25", imageTone: "#556B2F" },
      { name: "Cannoli Bites", description: "Sweet ricotta-filled shells with chocolate drizzle.", price: "$6.50", imageTone: "#F8F4EC" },
      { name: "Fountain Drink", description: "Choose cola, lemon-lime, tea, or root beer.", price: "$2.75", imageTone: "#5C4033" }
    ],
    servicesTitle: "Restaurant flows",
    services: [
      { name: "Pickup time selector", description: "Set ASAP, scheduled pickup, prep time, and customer alerts.", meta: "25-35 min" },
      { name: "Catering request", description: "Party trays, guest count, event date, and delivery notes.", meta: "Events" },
      { name: "Employment application", description: "Apply for counter, delivery, kitchen, or management roles.", meta: "Hiring" }
    ],
    flowTitle: "Order builder",
    flowDescription: "A fake ordering panel for size, crust, toppings, pickup time, and cart total.",
    flowFields: ["Pizza size", "Crust", "Extra toppings", "Pickup time"],
    flowSummary: ["Large pepperoni", "Add garlic knots", "Pickup at 6:15 PM", "Estimated total $31.48"],
    checkoutTitle: "Pickup cart",
    checkoutLines: [
      { name: "Large Pepperoni Pizza", price: "$17.99", meta: "Thin crust" },
      { name: "Garlic Parm Wings", price: "$13.50", meta: "10 count" },
      { name: "Pickup", price: "$0", meta: "6:15 PM" }
    ],
    galleryTitle: "Tonight's specials",
    gallery: [
      { name: "Family Pizza Night", description: "Two large pizzas, wings, and a 2-liter.", meta: "$42.99" },
      { name: "Lunch slice combo", description: "Two slices, side salad, and drink.", meta: "$9.99" },
      { name: "Catering tray", description: "Half tray pasta, salad, and garlic rolls.", meta: "Feeds 12" }
    ],
    reviews: [
      { name: "Nate B.", quote: "Pickup time and cart summary make this feel ready for a real pizza shop.", detail: "Local customer" },
      { name: "Pete", quote: "I can see catering, hiring, and ordering all working from one site.", detail: "Owner" }
    ],
    promo: "Open 11 AM-10 PM. Carryout special: large cheese pizza $10.99.",
    footerLinks: ["Menu", "Hours", "Location", "Careers"]
  },
  "northwood-chiropractic": {
    slug: "northwood-chiropractic",
    brandLine: "Wellness care, movement support, and patient intake",
    heroTitle: "Clear patient journeys for modern chiropractic care.",
    heroText: "A clean clinic platform with service education, provider bio, appointment request, intake preview, insurance FAQ, testimonials, and office hours.",
    nav: ["Services", "Appointments", "Intake", "Insurance", "FAQ"],
    primaryAction: "Request appointment",
    secondaryAction: "Start intake",
    categories: ["Adjustments", "Decompression", "Posture", "Massage", "Sports recovery"],
    itemsTitle: "Care pathways",
    items: [
      { name: "Chiropractic Adjustment", description: "Focused alignment visit with movement assessment.", price: "30 min", badge: "Core care", imageTone: "#7DA8BE" },
      { name: "Spinal Decompression", description: "Non-surgical decompression session concept for disc pressure.", price: "45 min", imageTone: "#A8C3B0" },
      { name: "Posture Correction", description: "Desk posture assessment, care plan, and at-home exercises.", price: "Plan", imageTone: "#D9D9D9" },
      { name: "Massage Therapy", description: "Soft tissue support for mobility and recovery.", price: "60 min", imageTone: "#243447" },
      { name: "Sports Injury Recovery", description: "Mobility care for active patients and athletes.", price: "Program", imageTone: "#7DA8BE" }
    ],
    servicesTitle: "Patient confidence",
    services: [
      { name: "Provider bio", description: "Dr. Lena Hart, DC, movement-first care and family wellness.", meta: "12 yrs" },
      { name: "Insurance FAQ", description: "Accepted plans, cash pay options, and verification workflow.", meta: "Clarity" },
      { name: "Office hours", description: "Mon-Thu 8-6, Fri 8-2, Saturday by appointment.", meta: "Hours" }
    ],
    flowTitle: "Appointment request",
    flowDescription: "A patient-friendly mock form for reason, preferred time, insurance, and first-visit intake.",
    flowFields: ["Visit reason", "Preferred provider", "Insurance provider", "Preferred time"],
    flowSummary: ["New patient selected", "Insurance verification needed", "Intake form queued", "Office callback requested"],
    checkoutTitle: "Appointment summary",
    checkoutLines: [
      { name: "New patient consultation", price: "Request", meta: "Adjustment evaluation" },
      { name: "Insurance verification", price: "Pending", meta: "Front desk review" },
      { name: "Intake form", price: "Ready", meta: "Secure portal placeholder" }
    ],
    galleryTitle: "Patient resources",
    gallery: [
      { name: "Desk posture guide", description: "Five adjustments for better workday alignment.", meta: "Blog" },
      { name: "First visit checklist", description: "What to bring and how the appointment works.", meta: "Patient info" },
      { name: "Recovery stretches", description: "At-home mobility videos for common complaints.", meta: "Education" }
    ],
    reviews: [
      { name: "Sarah L.", quote: "The intake and insurance flow would save so many phone calls.", detail: "Patient" },
      { name: "Dr. Hart", quote: "This feels calm, professional, and useful for a clinic.", detail: "Provider" }
    ],
    promo: "New patient appointments available this week.",
    footerLinks: ["Services", "Insurance", "Office hours", "Patient forms"]
  },
  "harbor-family-practice": {
    slug: "harbor-family-practice",
    brandLine: "Primary care for adults, children, and families",
    heroTitle: "A professional front door for patient care.",
    heroText: "A medical practice demo with provider directory, adult/child service cards, appointment request, resources, insurance, announcements, and portal placeholder.",
    nav: ["Providers", "Appointments", "Resources", "Insurance", "Portal"],
    primaryAction: "Request appointment",
    secondaryAction: "Patient portal",
    categories: ["Adult care", "Pediatrics", "Preventive visits", "Labs", "Telehealth"],
    itemsTitle: "Care services",
    items: [
      { name: "Adult Primary Care", description: "Annual visits, chronic condition follow-up, medication checks.", price: "Visit", imageTone: "#2563EB" },
      { name: "Child Wellness Visits", description: "School physicals, growth checks, immunization planning.", price: "Peds", imageTone: "#DFF6FF" },
      { name: "Preventive Screenings", description: "Routine labs, referrals, and care reminders.", price: "Annual", imageTone: "#64748B" },
      { name: "Telehealth Follow-Up", description: "Secure virtual care placeholder for established patients.", price: "Online", imageTone: "#0F172A" }
    ],
    servicesTitle: "Practice operations",
    services: [
      { name: "Provider directory", description: "Dr. Miles Reed, Dr. Priya Shah, NP Cam Owens.", meta: "3 providers" },
      { name: "Accepted insurance", description: "BlueCross, Aetna, United, Medicare, self-pay options.", meta: "Coverage" },
      { name: "Announcements", description: "Flu clinic dates, holiday hours, portal updates.", meta: "Office news" }
    ],
    flowTitle: "Appointment request",
    flowDescription: "A medical-safe request flow for visit type, patient status, preferred date, and callback needs.",
    flowFields: ["Patient status", "Visit type", "Preferred date", "Insurance"],
    flowSummary: ["Established patient", "Adult wellness visit", "Portal message option", "Office review required"],
    checkoutTitle: "Visit request",
    checkoutLines: [
      { name: "Adult wellness visit", price: "Requested", meta: "Dr. Reed" },
      { name: "Insurance", price: "Aetna", meta: "Verification pending" },
      { name: "Portal link", price: "Placeholder", meta: "Future integration" }
    ],
    galleryTitle: "Patient resources",
    gallery: [
      { name: "Flu clinic announced", description: "Saturday clinic openings for established patients.", meta: "Announcement" },
      { name: "New patient packet", description: "Downloadable intake and privacy forms placeholder.", meta: "Resource" },
      { name: "Medication refill guide", description: "How refill requests are reviewed and routed.", meta: "Portal" }
    ],
    reviews: [
      { name: "Harbor patient", quote: "The resources and appointment sections feel clear and trustworthy.", detail: "Family care" },
      { name: "Practice manager", quote: "This would organize announcements and appointment requests beautifully.", detail: "Operations" }
    ],
    promo: "Flu clinic appointments open for October.",
    footerLinks: ["Providers", "Insurance", "Resources", "Portal"]
  },
  "obsidian-tech-er": {
    slug: "obsidian-tech-er",
    brandLine: "Emergency mobile tech repair and device intake",
    heroTitle: "Repair intake that moves as fast as the emergency.",
    heroText: "A cyber repair platform with device intake, quote estimator, service area, repair tracker, appointment booking, priority options, invoice/deposit preview.",
    nav: ["Repair Intake", "Devices", "Tracker", "Appointments", "Invoice"],
    primaryAction: "Start repair intake",
    secondaryAction: "Track repair",
    categories: ["Phones", "Tablets", "Laptops", "Consoles", "Emergency visit"],
    itemsTitle: "Repair types",
    items: [
      { name: "Cracked Phone Screen", description: "Model, color, part availability, and priority fee logic.", price: "from $89", badge: "Fast", imageTone: "#7C3AED" },
      { name: "Charging Port Failure", description: "Cleaning, diagnostic, part replacement, and warranty note.", price: "from $69", imageTone: "#22C55E" },
      { name: "Laptop Tune-Up", description: "Performance cleanup, drive health, updates, and malware check.", price: "from $99", imageTone: "#A1A1AA" },
      { name: "Console HDMI Repair", description: "Drop-off or mobile diagnostic workflow concept.", price: "quote", imageTone: "#0B0F14" }
    ],
    servicesTitle: "Repair operations",
    services: [
      { name: "Quote estimator", description: "Device, issue, distance, priority, and deposit logic.", meta: "AI ready" },
      { name: "Service area", description: "Travel fee tiers by zip code and emergency window.", meta: "Mobile" },
      { name: "Repair tracker", description: "Received, diagnosed, parts ordered, repair, ready.", meta: "Status" }
    ],
    flowTitle: "Device intake form",
    flowDescription: "A field-ready workflow for device details, symptoms, priority, appointment, and deposit preview.",
    flowFields: ["Device model", "Issue type", "Service zip", "Priority level"],
    flowSummary: ["Emergency priority selected", "Travel fee estimated", "Deposit invoice ready", "Technician dashboard queued"],
    checkoutTitle: "Repair deposit",
    checkoutLines: [
      { name: "Screen repair estimate", price: "$129", meta: "iPhone 14" },
      { name: "Emergency priority", price: "$35", meta: "Same day" },
      { name: "Deposit due", price: "$65", meta: "Square placeholder" }
    ],
    galleryTitle: "Live tracker",
    gallery: [
      { name: "Ticket OTE-1042", description: "Diagnostic complete, awaiting part confirmation.", meta: "In progress" },
      { name: "Service radius", description: "0-10 miles included, 10-25 miles travel fee.", meta: "Area" },
      { name: "Technician dashboard", description: "Route, notes, invoice, and completion checklist.", meta: "Internal" }
    ],
    reviews: [
      { name: "Marcus J.", quote: "The tracker and deposit flow make mobile repair feel premium.", detail: "Device owner" },
      { name: "Tech operator", quote: "This captures everything I need before driving out.", detail: "Repair business" }
    ],
    promo: "Same-day emergency slots shown for demo purposes.",
    footerLinks: ["Repair intake", "Service area", "Tracker", "Invoice"]
  },
  "summit-legal-group": {
    slug: "summit-legal-group",
    brandLine: "Strategic counsel with premium intake",
    heroTitle: "Professional credibility from first consultation.",
    heroText: "A law firm demo with practice areas, consultation request, attorney profiles, testimonials, case result examples, legal resources, and credentials.",
    nav: ["Practice Areas", "Attorneys", "Consultation", "Results", "Resources"],
    primaryAction: "Book consultation",
    secondaryAction: "View practice areas",
    categories: ["Business", "Estate", "Real estate", "Employment", "Civil matters"],
    itemsTitle: "Practice areas",
    items: [
      { name: "Business Formation", description: "LLCs, operating agreements, contracts, and compliance.", price: "Consult", imageTone: "#0F172A" },
      { name: "Estate Planning", description: "Wills, trusts, powers of attorney, and family planning.", price: "Plan", imageTone: "#C8A96B" },
      { name: "Real Estate Counsel", description: "Purchase agreements, disputes, and transaction review.", price: "Review", imageTone: "#1E293B" },
      { name: "Employment Advisory", description: "Policy review, negotiations, and risk assessment.", price: "Counsel", imageTone: "#CBD5E1" }
    ],
    servicesTitle: "Trust signals",
    services: [
      { name: "Attorney profiles", description: "Evelyn Grant, Marcus Bell, Hannah Price.", meta: "Team" },
      { name: "Consultation intake", description: "Matter type, urgency, conflict check, and preferred contact.", meta: "Lead capture" },
      { name: "Credentials", description: "Bar admissions, associations, awards, and speaking notes.", meta: "Authority" }
    ],
    flowTitle: "Consultation request",
    flowDescription: "A polished intake flow with matter type, urgency, short summary, and conflict-check placeholder.",
    flowFields: ["Matter type", "Urgency", "Preferred attorney", "Brief summary"],
    flowSummary: ["Conflict check pending", "Consultation requested", "Document upload placeholder", "Admin review required"],
    checkoutTitle: "Consultation intake",
    checkoutLines: [
      { name: "Business contract review", price: "Request", meta: "Attorney review" },
      { name: "Urgency", price: "This week", meta: "Scheduling" },
      { name: "Conflict check", price: "Pending", meta: "Required" }
    ],
    galleryTitle: "Results and resources",
    gallery: [
      { name: "$1.2M transaction closed", description: "Commercial acquisition support example.", meta: "Case result" },
      { name: "Contract checklist", description: "Five terms to review before signing.", meta: "Article" },
      { name: "Founder legal guide", description: "Entity and agreement basics for new companies.", meta: "Resource" }
    ],
    reviews: [
      { name: "Avery T.", quote: "The intake is polished enough for high-value professional services.", detail: "Business owner" },
      { name: "Summit partner", quote: "This balances luxury design with useful lead capture.", detail: "Attorney" }
    ],
    promo: "Confidential consultation requests are simulated for demo purposes.",
    footerLinks: ["Practice areas", "Attorneys", "Resources", "Consultation"]
  },
  "bluepeak-realty": {
    slug: "bluepeak-realty",
    brandLine: "Upscale property search and agent lead capture",
    heroTitle: "Find the next address with confidence.",
    heroText: "A real estate platform demo with property cards, search filters, listing preview, agent profiles, showing request, neighborhoods, and lead capture.",
    nav: ["Listings", "Neighborhoods", "Agents", "Valuation", "Contact"],
    primaryAction: "Search listings",
    secondaryAction: "Book showing",
    categories: ["Waterfront", "Family homes", "Condos", "New builds", "Investment"],
    itemsTitle: "Featured properties",
    items: [
      { name: "418 Harbor View Lane", description: "4 bed, 3 bath waterfront home with renovated kitchen.", price: "$689,000", badge: "Featured", imageTone: "#3B82F6" },
      { name: "22 Pinecrest Court", description: "New build with open layout, office, and covered patio.", price: "$512,000", imageTone: "#E8DCCF" },
      { name: "9 Market Street Loft", description: "Downtown condo with exposed brick and garage parking.", price: "$328,000", imageTone: "#334155" },
      { name: "76 Willow Bend", description: "Family home near schools, parks, and trail access.", price: "$449,000", imageTone: "#4B6B4E" }
    ],
    servicesTitle: "Realty workflows",
    services: [
      { name: "Search/filter bar", description: "Price, beds, city, neighborhood, property type.", meta: "Listings" },
      { name: "Showing request", description: "Preferred date/time, agent, financing status, contact info.", meta: "Lead" },
      { name: "Neighborhood highlights", description: "Schools, commute, parks, market stats, lifestyle notes.", meta: "Local" }
    ],
    flowTitle: "Showing request",
    flowDescription: "A lead capture flow for buyer timeline, property interest, financing, and preferred showing slot.",
    flowFields: ["Price range", "Beds", "Preferred area", "Showing time"],
    flowSummary: ["4 properties matched", "Agent assigned", "Showing requested", "Lead saved to CRM"],
    checkoutTitle: "Buyer lead",
    checkoutLines: [
      { name: "Harbor View Lane", price: "$689k", meta: "Favorite" },
      { name: "Showing request", price: "Sat 2 PM", meta: "Pending" },
      { name: "Agent follow-up", price: "Assigned", meta: "Mia Chen" }
    ],
    galleryTitle: "Neighborhood highlights",
    gallery: [
      { name: "Harbor District", description: "Waterfront dining, marina, walkable downtown.", meta: "Lifestyle" },
      { name: "North Ridge", description: "Quiet streets, parks, strong school access.", meta: "Families" },
      { name: "Market Core", description: "Condos, rentals, nightlife, commuter rail.", meta: "Urban" }
    ],
    reviews: [
      { name: "Buyer lead", quote: "The listing and showing flow feels like a real brokerage site.", detail: "Homebuyer" },
      { name: "Agent Mia", quote: "Property interest and lead capture are immediately useful.", detail: "Agent" }
    ],
    promo: "New waterfront listings updated every Friday.",
    footerLinks: ["Listings", "Agents", "Valuation", "Neighborhoods"]
  },
  "evergreen-outdoor-living": {
    slug: "evergreen-outdoor-living",
    brandLine: "Premium outdoor living, landscaping, and seasonal care",
    heroTitle: "Outdoor projects quoted with clarity.",
    heroText: "A contractor platform demo with service grid, before/after gallery, quote flow, service area placeholder, financing, testimonials, and seasonal promotions.",
    nav: ["Services", "Gallery", "Financing", "Service Areas", "Quote"],
    primaryAction: "Request quote",
    secondaryAction: "View transformations",
    categories: ["Patios", "Decks", "Landscaping", "Lighting", "Seasonal cleanups"],
    itemsTitle: "Outdoor services",
    items: [
      { name: "Paver Patio Design", description: "Layout, drainage, material selection, and installation plan.", price: "Quote", badge: "Popular", imageTone: "#2F5D50" },
      { name: "Deck Refresh", description: "Repair, stain, railing updates, and lighting add-ons.", price: "Estimate", imageTone: "#8B5E3C" },
      { name: "Landscape Bed Install", description: "Mulch, edging, planting plan, and seasonal maintenance.", price: "Quote", imageTone: "#F7F4ED" },
      { name: "Outdoor Lighting", description: "Pathway, patio, and accent lighting package.", price: "Package", imageTone: "#EA580C" }
    ],
    servicesTitle: "Project planning",
    services: [
      { name: "Quote request flow", description: "Project type, dimensions, materials, photos, and timeline.", meta: "Lead" },
      { name: "Service area map", description: "Coverage placeholder with county and city filters.", meta: "Map" },
      { name: "Financing banner", description: "Monthly payment messaging for larger outdoor projects.", meta: "Upsell" }
    ],
    flowTitle: "Quote request",
    flowDescription: "A contractor-ready lead form with project details, photo upload placeholder, budget, and scheduling.",
    flowFields: ["Project type", "Approx. size", "Budget", "Preferred season"],
    flowSummary: ["Patio project", "Photos requested", "Financing interested", "Site visit pending"],
    checkoutTitle: "Project estimate",
    checkoutLines: [
      { name: "Paver patio", price: "$8k-$14k", meta: "Rough range" },
      { name: "Lighting add-on", price: "$1.2k+", meta: "Optional" },
      { name: "Site visit", price: "Requested", meta: "Next week" }
    ],
    galleryTitle: "Before and after",
    gallery: [
      { name: "Backyard patio", description: "Plain lawn transformed into dining and fire pit zone.", meta: "Before/after" },
      { name: "Front entry refresh", description: "New beds, edging, lighting, and walkway repair.", meta: "Curb appeal" },
      { name: "Deck and pergola", description: "Warm wood finish with shade and evening lighting.", meta: "Outdoor room" }
    ],
    reviews: [
      { name: "Homeowner", quote: "The before/after and financing sections make the service feel premium.", detail: "Project lead" },
      { name: "Contractor", quote: "The quote form asks for the details I actually need.", detail: "Owner" }
    ],
    promo: "Spring cleanup and patio planning slots are open now.",
    footerLinks: ["Services", "Gallery", "Financing", "Quote"]
  }
};
