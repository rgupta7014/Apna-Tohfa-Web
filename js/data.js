/**
 * Apna Tohfa - Data Store
 * Brand: APNA TOHFA | Tagline: "Apno Ke Liye, Dil Se."
 */

const APNA_DATA = {
  brand: {
    name: "APNA TOHFA",
    tagline: "Apno Ke Liye, Dil Se.",
    phone: "+91 98765 43210",
    phoneDisplay: "+91 98765 43210",
    email: "namaste@apnatohfa.in",
    corporateEmail: "corporate@apnatohfa.in",
    whatsapp: "919876543210",
    address: "Regal Pavilion, Connaught Place, New Delhi - 110001",
    hours: "Mon - Sun: 9:00 AM - 9:00 PM IST (Diwali 24/7 Dispatch Desk)"
  },

  categories: [
    {
      id: "small-basket",
      title: "Small Basket",
      subtitle: "Artisanal woven mini basket with gourmet treats",
      priceTag: "Starting from ₹349",
      minPrice: 349,
      badge: "Compact Hamper",
      icon: "🧺"
    },
    {
      id: "medium-basket",
      title: "Medium Basket",
      subtitle: "Classic festive wicker basket with sweets & nuts",
      priceTag: "Starting from ₹699",
      minPrice: 699,
      badge: "Family Favorite",
      icon: "🧺"
    },
    {
      id: "large-basket",
      title: "Large Basket",
      subtitle: "Grand celebration basket with regal brass keepsakes",
      priceTag: "Starting from ₹1,299",
      minPrice: 1299,
      badge: "Grand Hamper",
      icon: "🧺"
    },
    {
      id: "small-basket-jar",
      title: "Small Basket Jar",
      subtitle: "Mini woven basket with airtight dry fruit jars",
      priceTag: "Starting from ₹449",
      minPrice: 449,
      badge: "Jar Duo",
      icon: "🫙"
    },
    {
      id: "medium-jar-basket",
      title: "Medium Jar Basket",
      subtitle: "Handcrafted basket with 4 premium glass jars",
      priceTag: "Starting from ₹899",
      minPrice: 899,
      badge: "Gourmet Jars",
      icon: "🫙"
    },
    {
      id: "large-jar-basket",
      title: "Large Jar Basket",
      subtitle: "Luxury regal basket featuring 6 hexagonal dry fruit jars",
      priceTag: "Starting from ₹1,599",
      minPrice: 1599,
      badge: "Royal Jar Suite",
      icon: "🫙"
    },
    {
      id: "budget",
      title: "Budget Hampers",
      subtitle: "Thoughtful & pocket-friendly festive joy",
      priceTag: "Starting from ₹299",
      minPrice: 299,
      badge: "Festive Value",
      icon: "✨"
    },
    {
      id: "premium",
      title: "Premium Hampers",
      subtitle: "Curated dry fruits & gourmet mithai",
      priceTag: "Starting from ₹799",
      minPrice: 799,
      badge: "Bestseller Tier",
      icon: "🪔"
    },
    {
      id: "luxury",
      title: "Luxury Hampers",
      subtitle: "Velvet boxes, brass keepsakes & gold foils",
      priceTag: "Starting from ₹1,199",
      minPrice: 1199,
      badge: "Royal Collection",
      icon: "👑"
    },
    {
      id: "corporate",
      title: "Corporate Gifting",
      subtitle: "Bulk orders with company logo & branding",
      priceTag: "Bulk & Customized Orders",
      minPrice: 399,
      badge: "B2B Volume Discounts",
      icon: "🏢"
    }
  ],

  products: [
    {
      id: "small-basket-hamper",
      name: "Anand Chhoti Tokri (Small Basket)",
      category: "small-basket",
      badge: "Handcrafted Basket",
      badgeType: "accent",
      price: 349,
      originalPrice: 499,
      discount: "30% OFF",
      rating: 4.8,
      reviewsCount: 184,
      shortDescription: "Charming small woven festive basket with pure desi ghee sweets, hand-painted diya & roasted nuts.",
      fullDescription: "A delightful small woven basket curated for intimate festive gifting. Includes handcrafted sweets, terracotta diya with cotton wicks, roasted nuts potli, and festive greeting card.",
      image: "assets/images/shubh-aarambh.jpg",
      inStock: true,
      dispatchTime: "Ships in 24 Hours",
      tags: ["Small Basket", "Basket", "Sweets", "Diwali"],
      whatsInside: [
        { item: "Pure Ghee Besan Laddoos (4 pcs)", icon: "🥮" },
        { item: "Roasted California Almonds (60g)", icon: "🌰" },
        { item: "Hand-painted Terracotta Diya", icon: "🪔" },
        { item: "Handwoven Small Cane Basket with Gold Ribbon", icon: "🧺" }
      ],
      customizationOptions: ["Custom Diwali Message Card"],
      corporateAvailable: true
    },
    {
      id: "medium-basket-hamper",
      name: "Kalyan Madhyam Tokri (Medium Basket)",
      category: "medium-basket",
      badge: "Popular Basket",
      badgeType: "bestseller",
      price: 699,
      originalPrice: 999,
      discount: "30% OFF",
      rating: 4.9,
      reviewsCount: 268,
      shortDescription: "Generous medium cane festive basket with premium kaju katli, whole cashews, raisins & Moradabad diya.",
      fullDescription: "Our beloved medium basket brings traditional abundance to family festivities. Packed with artisanal kaju katli, jumbo cashews, sweet raisins, and a pure brass Moradabad diya.",
      image: "assets/images/apna-tohfa.jpg",
      inStock: true,
      dispatchTime: "Ships in 24 Hours",
      tags: ["Medium Basket", "Basket", "Kaju Katli", "Brass Diya"],
      whatsInside: [
        { item: "Artisanal Kaju Katli (150g)", icon: "🍬" },
        { item: "California Roasted Cashews (100g)", icon: "🌰" },
        { item: "Sweet Golden Afghan Raisins (100g)", icon: "🍇" },
        { item: "Solid Brass Traditional Moradabad Diya", icon: "🪔" },
        { item: "Sturdy Handcrafted Medium Cane Basket", icon: "🧺" }
      ],
      customizationOptions: ["Personalized Card", "Silk Ribbon"],
      corporateAvailable: true
    },
    {
      id: "large-basket-hamper",
      name: "Utsav Vishal Tokri (Large Basket)",
      category: "large-basket",
      badge: "Grand Feast",
      badgeType: "royal",
      price: 1299,
      originalPrice: 1899,
      discount: "32% OFF",
      rating: 5.0,
      reviewsCount: 142,
      shortDescription: "Regal large celebration basket overflowing with assorted sweets, premium dry fruit collection & brass lamp set.",
      fullDescription: "A magnificent large festive basket designed to dazzle. Features an expansive selection of pistachios, almonds, cashews, assorted sweets, brass akhand diya, and luxury festive wrapping.",
      image: "assets/images/royal-celebration.jpg",
      inStock: true,
      dispatchTime: "Ships in 24 Hours",
      tags: ["Large Basket", "Basket", "Royal", "Luxury"],
      whatsInside: [
        { item: "Assorted Royal Sweets Box (300g)", icon: "🍬" },
        { item: "Roasted Pistachios & Almonds Potlis (200g)", icon: "🌰" },
        { item: "Caramelized Walnuts Tin (100g)", icon: "🥜" },
        { item: "Pure Brass Akhand Jyot Diya", icon: "🪔" },
        { item: "Grand Wicker Basket with Gold Foil Satin Wrap", icon: "🧺" }
      ],
      customizationOptions: ["Custom Corporate Note", "Logo Ribbon"],
      corporateAvailable: true
    },
    {
      id: "small-basket-jar-hamper",
      name: "Shubh Laghu Jar Tokri (Small Basket Jar)",
      category: "small-basket-jar",
      badge: "Airtight Jars",
      badgeType: "accent",
      price: 449,
      originalPrice: 649,
      discount: "31% OFF",
      rating: 4.8,
      reviewsCount: 195,
      shortDescription: "Mini woven basket paired with 2 airtight glass jars filled with California almonds & salted cashews.",
      fullDescription: "A modern yet ethnic presentation featuring twin hexagonal glass jars filled with roasted almonds and cashews, arranged in a handcrafted mini basket with brass tea-light diya.",
      image: "assets/images/khushi-special.jpg",
      inStock: true,
      dispatchTime: "Ships in 24 Hours",
      tags: ["Small Basket Jar", "Jar", "Dry Fruits", "Basket"],
      whatsInside: [
        { item: "Airtight Glass Jar with Roasted Almonds (100g)", icon: "🫙" },
        { item: "Airtight Glass Jar with Salted Cashews (100g)", icon: "🫙" },
        { item: "Floral Scented Diya with Cotton Wicks", icon: "🪔" },
        { item: "Handwoven Mini Basket with Gold Handle", icon: "🧺" }
      ],
      customizationOptions: ["Custom Wish Note"],
      corporateAvailable: true
    },
    {
      id: "medium-jar-basket-hamper",
      name: "Sampoorna Jar Basket (Medium Jar Basket)",
      category: "medium-jar-basket",
      badge: "Bestseller Jar Set",
      badgeType: "bestseller",
      price: 899,
      originalPrice: 1299,
      discount: "31% OFF",
      rating: 4.9,
      reviewsCount: 310,
      shortDescription: "Artistic medium wicker basket showcasing 4 golden-lid glass jars of dry fruits, sweets & brass diya.",
      fullDescription: "The quintessential Diwali jar basket. Four reusable glass jars packed with roasted almonds, cashews, raisins, and artisanal dry fruit laddoos, complemented by a gleaming brass diya.",
      image: "assets/images/shahi-tohfa.jpg",
      inStock: true,
      dispatchTime: "Ships in 24 Hours",
      tags: ["Medium Jar Basket", "4 Jars", "Gourmet", "Basket"],
      whatsInside: [
        { item: "Glass Jar - Roasted California Almonds (100g)", icon: "🫙" },
        { item: "Glass Jar - Whole Roasted Cashews (100g)", icon: "🫙" },
        { item: "Glass Jar - Afghan Green Raisins (100g)", icon: "🫙" },
        { item: "Glass Jar - Dry Fruit Anjeer Bites (100g)", icon: "🫙" },
        { item: "Handcrafted Brass Diya & Silk Ribbon Medium Basket", icon: "🧺" }
      ],
      customizationOptions: ["Personalized Greeting Card", "Corporate Sleeves"],
      corporateAvailable: true
    },
    {
      id: "large-jar-basket-hamper",
      name: "Rajshahi Mahabasket Jar (Large Jar Basket)",
      category: "large-jar-basket",
      badge: "Royal Jar Suite",
      badgeType: "royal",
      price: 1599,
      originalPrice: 2299,
      discount: "30% OFF",
      rating: 5.0,
      reviewsCount: 178,
      shortDescription: "Extravagant grand basket displaying 6 premium glass jars with exotic dry fruits, berries & Moradabad diya.",
      fullDescription: "Our most opulent jar creation. Six large glass jars containing California pistachios, mamra almonds, jumbo cashews, dried cranberries, blueberries, and silver-foil kaju katli in a majestic basket.",
      image: "assets/images/hero-hamper.jpg",
      inStock: true,
      dispatchTime: "Ships in 24 Hours",
      tags: ["Large Jar Basket", "6 Jars", "Luxury", "VIP Gifting"],
      whatsInside: [
        { item: "6x Airtight Embossed Glass Jars (Total 600g Dry Fruits & Berries)", icon: "🫙" },
        { item: "Moradabad Pure Brass Engraved Diya", icon: "🪔" },
        { item: "Handmade Scented Soy Wax Floral Candle", icon: "🕯️" },
        { item: "Grand Natural Willow Basket with Gold Velvet Ribbon", icon: "🧺" }
      ],
      customizationOptions: ["Custom Corporate Logo Box Sleeve", "Personalized Note"],
      corporateAvailable: true
    },
    {
      id: "shubh-aarambh",
      name: "Shubh Aarambh",
      category: "budget",
      badge: "Budget Friendly",
      badgeType: "accent",
      price: 299,
      originalPrice: 499,
      discount: "40% OFF",
      rating: 4.8,
      reviewsCount: 342,
      shortDescription: "A beautiful budget-friendly Diwali hamper with artisanal sweets, painted diya & roasted almonds.",
      fullDescription: "Begin your Diwali festivities on an auspicious note with 'Shubh Aarambh'. Thoughtfully designed to offer a rich festive gesture at an accessible price point, this hamper combines traditional taste, festive light, and wholesome goodness.",
      image: "assets/images/shubh-aarambh.jpg",
      inStock: true,
      dispatchTime: "Ships in 24 Hours",
      tags: ["Budget", "Under ₹500", "Sweets", "Diya", "Almonds"],
      whatsInside: [
        { item: "Artisanal Kaju Katli (100g)", icon: "🍬" },
        { item: "Besan Laddoos made with Pure Desi Ghee (4 pcs)", icon: "🥮" },
        { item: "Hand-painted Terracotta Diya with pure cotton wicks", icon: "🪔" },
        { item: "Jute Potli with Roasted California Almonds (60g)", icon: "🌰" },
        { item: "Gold Foiled 'Shubh Deepavali' Greeting Card", icon: "📜" },
        { item: "Rigid Maroon & Gold Festive Keepsake Gift Box", icon: "🎁" }
      ],
      customizationOptions: ["Custom Diwali Card Message", "Choice of Gold/Red Ribbon"],
      corporateAvailable: true
    },
    {
      id: "apna-tohfa",
      name: "Apna Tohfa",
      category: "budget",
      badge: "Most Popular",
      badgeType: "bestseller",
      price: 499,
      originalPrice: 799,
      discount: "38% OFF",
      rating: 4.9,
      reviewsCount: 820,
      shortDescription: "A thoughtfully curated festive gift for your loved ones with pistachio sweets, nuts, brass diyas & royal scroll.",
      fullDescription: "Our signature flagship hamper that captures the true essence of 'Apno Ke Liye, Dil Se'. Crafted with love, this hamper brings together gourmet pistachio delights, roasted cashews in a golden tin, handcrafted brass diyas, and an emotional Diwali wish scroll.",
      image: "assets/images/apna-tohfa.jpg",
      inStock: true,
      dispatchTime: "Ships in 24 Hours",
      tags: ["Most Popular", "Under ₹500", "Bestseller", "Brass Diya", "Cashews"],
      whatsInside: [
        { item: "Gourmet Pistachio Diamond Sweets (150g)", icon: "🍬" },
        { item: "Premium Roasted Whole Cashews in Reusable Gold Tin (100g)", icon: "🌰" },
        { item: "Artisanal Dark Belgian Chocolates dusted with edible Gold Dust (6 pcs)", icon: "🍫" },
        { item: "Pair of Handcrafted Ornate Brass Diyas (Carved Motifs)", icon: "🪔" },
        { item: "Vintage Wax-Sealed Handwritten Wish Scroll", icon: "📜" },
        { item: "Signature Magnetic Maroon & Gold Gift Box with Satin Ribbon", icon: "🎁" }
      ],
      customizationOptions: ["Personalized Calligraphy Note", "Corporate Sleeve Branding (Min 25)", "Box Color Selection"],
      corporateAvailable: true
    },
    {
      id: "khushi-special",
      name: "Khushi Special",
      category: "premium",
      badge: "Festive Delight",
      badgeType: "popular",
      price: 799,
      originalPrice: 1199,
      discount: "33% OFF",
      rating: 4.9,
      reviewsCount: 512,
      shortDescription: "A premium hamper filled with festive favourites, kaju katli, assorted dry fruits & colorful designer diyas.",
      fullDescription: "Spread unbounded cheer with 'Khushi Special'. Loaded with festive favorites, this vibrant amber-gold gift box features a triple-tier dry fruit assortment, classic silver vark kaju katli, melt-in-mouth motichoor laddoos, and hand-painted peacock diyas.",
      image: "assets/images/khushi-special.jpg",
      inStock: true,
      dispatchTime: "Ships in 24 Hours",
      tags: ["Premium", "Dry Fruits", "Kaju Katli", "Designer Diya", "Family Gift"],
      whatsInside: [
        { item: "Classic Silver Vark Kaju Katli (200g)", icon: "🍬" },
        { item: "Kashmiri Walnuts, Jumbo Green Raisins & Roasted Almonds (180g total)", icon: "🌰" },
        { item: "Desi Ghee Motichoor Laddoos (5 pcs)", icon: "🥮" },
        { item: "Handcrafted Almond Brittles Jar (120g)", icon: "🍪" },
        { item: "Pair of Hand-painted Terracotta Peacock Diyas", icon: "🪔" },
        { item: "Personalized Peacock Gold-Foil Diwali Card", icon: "📜" },
        { item: "Festive Amber & Gold Rigid Box with Magnetic Clasp", icon: "🎁" }
      ],
      customizationOptions: ["Custom Family Name on Greeting Card", "Dry Fruit Selection Options", "Corporate Branding"],
      corporateAvailable: true
    },
    {
      id: "shahi-tohfa",
      name: "Shahi Tohfa",
      category: "luxury",
      badge: "Luxury Pick",
      badgeType: "royal",
      price: 1199,
      originalPrice: 1799,
      discount: "33% OFF",
      rating: 5.0,
      reviewsCount: 275,
      shortDescription: "A luxurious Diwali gifting experience with velvet rigid box, saffron sweets, macadamia & hanging brass diya.",
      fullDescription: "Fit for royalty, 'Shahi Tohfa' brings centuries-old royal Indian gifting traditions to life. Packaged in an opulent velvet-clad rigid chest with golden filigree, it holds saffron-infused sweets, imported macadamias and roasted pistachios, a hanging brass diya, and a luxury soy wax candle.",
      image: "assets/images/shahi-tohfa.jpg",
      inStock: true,
      dispatchTime: "Same Day Dispatch",
      tags: ["Luxury", "Velvet Box", "Brass Bell Diya", "Saffron Sweets", "Candle"],
      whatsInside: [
        { item: "Royal Saffron Almond Sweets & Silver Vark Gulab Barfi (250g)", icon: "🍬" },
        { item: "Premium Roasted Salted Pistachios in Glass Jar (120g)", icon: "🌰" },
        { item: "Slow-Roasted Honey Glazed Macadamia Nuts (100g)", icon: "🍯" },
        { item: "Carved Antique Brass Hanging Diya with Chain", icon: "🪔" },
        { item: "Hand-poured Diwali Bliss Mogra & Oud Soy Wax Candle in Crystal Glass", icon: "🕯️" },
        { item: "Shredded Golden Grass Nesting with Gold Embossed Card", icon: "✨" },
        { item: "Royal Deep Maroon Velvet Rigid Trunk with Antique Metal Clasp", icon: "🎁" }
      ],
      customizationOptions: ["Engraved Metal Nameplate on Box", "Custom Corporate Brass Sleeves", "Handwritten Letter"],
      corporateAvailable: true
    },
    {
      id: "royal-celebration",
      name: "Royal Celebration",
      category: "luxury",
      badge: "Ultra Luxury",
      badgeType: "royal",
      price: 1999,
      originalPrice: 2999,
      discount: "33% OFF",
      rating: 5.0,
      reviewsCount: 189,
      shortDescription: "An elegant premium hamper for special occasions with multi-tier presentation, crystal jars, idol & soy candle.",
      fullDescription: "The zenith of festive luxury. 'Royal Celebration' is designed for life's most meaningful moments, cherished family patriarchs, and top VIP enterprise leaders. Presented on multiple tiers with navy velvet and brocade accents, featuring an antique brass Ganesha idol, crystal jars of exotic dry fruits, and gold leaf mithai.",
      image: "assets/images/royal-celebration.jpg",
      inStock: true,
      dispatchTime: "Same Day Dispatch",
      tags: ["Ultra Luxury", "VIP Gifting", "Brass Ganesha", "Exotic Nuts", "Multi-Tier"],
      whatsInside: [
        { item: "Handcrafted Antique Brass Lord Ganesha Idol (Pooja blessed)", icon: "🕉️" },
        { item: "24K Edible Gold Leaf Kaju & Saffron Pedas (300g)", icon: "🍬" },
        { item: "Exotic Afghan Jumbo Cashews & Persian Roasted Pistachios in Crystal Jars (300g)", icon: "🌰" },
        { item: "Artisanal Single-Origin Chocolate Truffles with Gold Flakes (8 pcs)", icon: "🍫" },
        { item: "Carved Heavy Brass Diya with Brass Stand", icon: "🪔" },
        { item: "Midnight Navy & Gold Scented Luxury Candle (40+ hour burn)", icon: "🕯️" },
        { item: "Grand 3-Tier Rigid Presentation Box with Silk Brocade & Tassels", icon: "🎁" }
      ],
      customizationOptions: ["Custom Silk Inscription", "VIP Delivery Courier with Concierge Tracking", "Bespoke Engraving"],
      corporateAvailable: true
    },
    {
      id: "corporate-tohfa",
      name: "Corporate Tohfa",
      category: "corporate",
      badge: "Custom Branding",
      badgeType: "corporate",
      price: 599,
      originalPrice: 899,
      discount: "Bulk Tier Pricing",
      priceSuffix: "+",
      rating: 4.9,
      reviewsCount: 430,
      shortDescription: "Customizable corporate gifts for employees and clients with custom logo sleeve, notebook, nuts & truffles.",
      fullDescription: "Make business gifting seamless and memorable. 'Corporate Tohfa' is custom-engineered for corporate teams, HR departments, and enterprise clients. Includes company logo foil stamping on rigid matte-black packaging, executive journal, designer brass diya, California almonds, and luxury truffles.",
      image: "assets/images/corporate-tohfa.jpg",
      inStock: true,
      dispatchTime: "Bulk Scheduling Available",
      tags: ["Corporate Gifting", "Custom Logo", "Employee Gifts", "Client Gifting", "Bulk Order"],
      whatsInside: [
        { item: "Custom Branded Leatherette Executive Journal with Gold Trim Pen", icon: "📓" },
        { item: "California Almonds in Airtight Glass Jar with Company Logo Sleeve (150g)", icon: "🌰" },
        { item: "Handcrafted Designer Brass Diya with Floral Petal Rim", icon: "🪔" },
        { item: "Belgian Dark Chocolate Truffles Box (6 pcs)", icon: "🍫" },
        { item: "Personalized Leadership Diwali Greeting Card with Digital Signature", icon: "✉️" },
        { item: "Matte Black Magnetic Clasp Box with Gold Foil Company Logo", icon: "🏢" }
      ],
      customizationOptions: ["Full Company Logo Integration", "Split Shipping to 100+ Home Addresses", "Custom Color Ribbon"],
      corporateAvailable: true,
      isCorporateQuote: true
    }
  ],

  corporatePricing: [
    { range: "25–49 Boxes", price: 549, saving: "Save 20%", badge: "Small Teams", delivery: "Free Pan-India Delivery" },
    { range: "50–99 Boxes", price: 499, saving: "Save 28%", badge: "Most Popular", delivery: "Free Pan-India Delivery" },
    { range: "100–249 Boxes", price: 449, saving: "Save 35%", badge: "Best Value", delivery: "Free Multi-Address Shipping" },
    { range: "250+ Boxes", price: "399–449", saving: "Custom Volume Deal", badge: "Enterprise Tier", delivery: "Dedicated Account Manager + Free Custom Branding" }
  ],

  features: [
    {
      icon: "🎁",
      title: "Thoughtfully Curated",
      description: "Premium products selected for meaningful gifting, ensuring every taste and element resonates with heartfelt joy."
    },
    {
      icon: "✨",
      title: "Premium Packaging",
      description: "Rigid keepsake boxes, gold hot-stamping, satin ribbons and velvet textures ready to gift without any extra wrapping."
    },
    {
      icon: "🏢",
      title: "Corporate Friendly",
      description: "End-to-end bulk management, GST invoicing, custom company logo branding, and multi-address home delivery."
    },
    {
      icon: "🚚",
      title: "Reliable Delivery",
      description: "Safe, temperature-controlled, damage-proof packaging delivered across 27,000+ Indian pincodes on schedule."
    },
    {
      icon: "💝",
      title: "Personal Touch",
      description: "Complimentary personalized Diwali greeting cards with your custom message for your family or clients."
    },
    {
      icon: "💰",
      title: "Multiple Budgets",
      description: "Hampers starting from just ₹299 up to luxury VIP tiers, so you can spread festive happiness at any scale."
    }
  ],

  howItWorks: [
    {
      step: "01",
      icon: "🎁",
      title: "Choose Your Hamper",
      description: "Explore our Diwali 2026 collection tailored for budget, premium, luxury or corporate requirements."
    },
    {
      step: "02",
      icon: "✍️",
      title: "Place Your Order",
      description: "Add a free customized festive note, enter your delivery details or bulk address list, and checkout safely."
    },
    {
      step: "03",
      icon: "🪔",
      title: "Gift Happiness",
      description: "We pack each box with pristine care and deliver joyous festive smiles right to their doorsteps."
    }
  ],

  testimonials: [
    {
      quote: "Beautiful packaging and amazing presentation. The kaju katli and roasted almonds were so fresh! Perfect Diwali gift for our family and relatives.",
      author: "Priya Sharma",
      role: "Verified Customer",
      city: "New Delhi",
      rating: 5,
      hamper: "Apna Tohfa Hamper"
    },
    {
      quote: "The corporate hampers looked premium and our 220+ employees across 12 cities loved them. Zero damages and flawless timely delivery.",
      author: "Rajesh Nair",
      role: "VP People & Culture",
      company: "Apex Technologies, Bengaluru",
      rating: 5,
      hamper: "Corporate Tohfa (Bulk)"
    },
    {
      quote: "Apna Tohfa made our Diwali gifting very easy. Ordered 45 hampers for our top clients and received heartfelt appreciation calls from all of them.",
      author: "Ananya Sen",
      role: "Founder & Creative Director",
      city: "Mumbai",
      rating: 5,
      hamper: "Shahi Tohfa Hamper"
    },
    {
      quote: "The Shubh Aarambh at ₹299 blew me away. The box quality feels like ₹700, and the brass diya has a lovely traditional sheen. 10/10 recommend!",
      author: "Vikram Malhotra",
      role: "Verified Customer",
      city: "Pune",
      rating: 5,
      hamper: "Shubh Aarambh Hamper"
    }
  ],

  instagramFeed: [
    {
      image: "assets/images/insta-unboxing.jpg",
      caption: "Unboxing pure festive delight with golden satin ribbons and fresh marigolds. 🪔✨ #ApnaTohfa #DiwaliGifting",
      likes: "1.4k"
    },
    {
      image: "assets/images/insta-sweets.jpg",
      caption: "Silver vark kaju katli, jumbo roasted pistachios and pure ghee laddoos. Made fresh daily! 🍬 #FestiveMithai",
      likes: "2.1k"
    },
    {
      image: "assets/images/insta-family.jpg",
      caption: "Because Diwali is all about apno ki khushi. Warmest festive moments with our loved ones. 💛 #ApnoKeLiyeDilSe",
      likes: "3.8k"
    },
    {
      image: "assets/images/insta-corporate.jpg",
      caption: "Delivering smiles to 25,000+ corporate desks this Diwali! 🏢💼 Custom branded hampers that impress.",
      likes: "980"
    }
  ],

  coupons: {
    "DIWALI2026": { discountPercent: 10, minSpend: 0, label: "10% Festive Discount" },
    "SHUBH100": { discountFlat: 100, minSpend: 800, label: "Flat ₹100 OFF" },
    "CORP20": { discountPercent: 20, minSpend: 2500, label: "20% Corporate Volume Discount" }
  },

  pincodes: {
    "110001": { city: "New Delhi", state: "Delhi", days: "1-2 Days", express: true },
    "400001": { city: "Mumbai", state: "Maharashtra", days: "2-3 Days", express: true },
    "560001": { city: "Bengaluru", state: "Karnataka", days: "2-3 Days", express: true },
    "500001": { city: "Hyderabad", state: "Telangana", days: "2-3 Days", express: true },
    "600001": { city: "Chennai", state: "Tamil Nadu", days: "2-3 Days", express: true },
    "700001": { city: "Kolkata", state: "West Bengal", days: "3-4 Days", express: true },
    "380001": { city: "Ahmedabad", state: "Gujarat", days: "2-3 Days", express: true },
    "411001": { city: "Pune", state: "Maharashtra", days: "2-3 Days", express: true },
    "302001": { city: "Jaipur", state: "Rajasthan", days: "2 Days", express: true },
    "226001": { city: "Lucknow", state: "Uttar Pradesh", days: "2-3 Days", express: true },
    "160017": { city: "Chandigarh", state: "Punjab", days: "2 Days", express: true },
    "122001": { city: "Gurugram", state: "Haryana", days: "1-2 Days", express: true },
    "201301": { city: "Noida", state: "Uttar Pradesh", days: "1-2 Days", express: true }
  }
};
