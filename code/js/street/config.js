/* =========================================================
   Rosecat Lane — content you can edit
   Shop names, colours, shopkeepers, what they say, the items
   on display and where each "view online" button links to.
   "{tod}" in a line becomes Good morning / afternoon / evening.
   ========================================================= */

window.RC = window.RC || {};

// TODO: real shop URLs (same ones used in classic.html)
RC.LINKS = {
  etsy: "https://www.etsy.com/shop/YOURSHOP",
  ebay: "https://www.ebay.com/str/YOURSHOP",
  classic: "classic.html#shop",
};

RC.STREET_NAME = "Rosecat Lane";
RC.STREET_YEAR = "London, 1895";

/*
  side: "left" or "right" of the street (as you walk in), slot: 0 = nearest.
  front: shop-front paint colour, trim: gilding colour, wall: brick | yellow | stucco
  keeper.look: f = lady, m = gentleman
  items: kind must be one of the item builders in props.js
*/
RC.SHOPS = [
  {
    id: "jewellery",
    side: "left", slot: 0,
    sign: "ROSECAT & Co.", subsign: "Joailliers · Fine Jewellers since 1872",
    front: "#0c0d0e", trim: "#e0bd6a", wall: "stucco", wallpaper: "#2f4a3a",
    awning: null, upper: "pediment",
    // A grand house in the Place Vendôme manner: its own street front and a three-floor interior
    facade: "maison", interior: "maison",
    link: RC.LINKS.etsy,
    keeper: { name: "Mr. Ambrose Pell", look: "m" },
    farewell: "Good day to you, and do call again. The house is always open to a discerning eye.",

    /*
      Staff: one or two in each part of the house. `role` decides where they stand (see maison.js).
      look: how they appear. sex f/m, height (metres), build, skin, eyes, hair colour and hairStyle
            (pompadour | chignon | bun | curly | side | crop | bald | slick), facial (moustache |
            handlebar | beard | chops), outfit (gown | frock | morning | livery | whitejacket),
            extras (pearls, spectacles, pince-nez, lace, brooch, apron, cap, gloves, watchchain),
            holds (tray | shears | loupe).
      voice: gender f/m, pitch (1 = normal), rate (1 = normal); accent "fr" picks a French voice
             if the visitor's browser has one.
      greet: said the first time you come near. chat: said one at a time when you click them.
      escort: offered near the foot of the stairs (prompt), said on setting off and on arrival.
    */
    staff: [
      {
        role: "doorman", name: "Mr. Albert Fitch", title: "Doorman",
        look: { sex: "m", height: 1.86, build: 1.06, skin: "#d9b096", eyes: "#4a5a6a", hair: "#4a3a30", hairStyle: "side", facial: "chops",
          outfit: "livery", tie: "bow", colours: { coat: "#1d3b2a", vest: "#1d3b2a", trousers: "#16161a", tie: "#111111" }, extras: ["gloves"] },
        voice: { gender: "m", pitch: 0.75, rate: 0.9 },
        greet: [
          "{tod}, and welcome to Rosecat and Company.",
          "You are in the Display Salon. Our Salon de Thé is through the stair hall at the back, should you care for something sweet.",
          "The Grand Salon and the Winter Garden are on the first floor. Mademoiselle Odile, by the stairs, will gladly show you up.",
        ],
        chat: [
          "Fine weather above the fog today. The sun comes clean through our skylights.",
          "The Salon Privé is on the second floor. Mr. Hart, on the first floor, will take you up.",
          "Mind the step on your way out, if you please.",
        ],
      },
      {
        role: "display", name: "Mademoiselle Odile Marchand", title: "Vendeuse, Display Salon",
        look: { sex: "f", height: 1.64, skin: "#f0d2bc", eyes: "#3a2a1a", hair: "#2a1a12", hairStyle: "pompadour", outfit: "gown",
          colours: { dress: "#141416", blouse: "#141416", silk: true, collar: "#f4efe6", accent: "#141416" }, extras: ["lace", "brooch"] },
        voice: { gender: "f", pitch: 1.15, rate: 1.0, accent: "fr" },
        greet: [
          "Bonjour! Welcome to the Display Salon. Every case is open to you.",
          "The tiara in the tower came from a workshop on the Rue de la Paix. Do have a closer look.",
        ],
        chat: [
          "The diamonds near the stair hall fairly dance when the sun is high.",
          "Upstairs in the Grand Salon we keep the watches and signet rings. I would be glad to take you.",
        ],
        escort: {
          prompt: "Shall I show you up to the Grand Salon on the first floor?",
          start: ["With pleasure. This way, if you please. Mind the runner on the stairs."],
          arrive: ["Voilà, the Grand Salon. Mrs. Vane will look after you here. The Winter Garden is through the gallery, just behind you."],
        },
      },
      {
        role: "barman", name: "Monsieur Gaston Rey", title: "Pâtissier, Salon de Thé",
        look: { sex: "m", height: 1.72, build: 1.22, skin: "#e6bfa0", eyes: "#3a2a1a", hair: "#3a2a20", hairStyle: "bald", facial: "handlebar",
          outfit: "whitejacket", tie: "bow", colours: { tie: "#1a1a1a", trousers: "#2a2a2e" }, extras: ["apron"] },
        voice: { gender: "m", pitch: 1.0, rate: 1.05, accent: "fr" },
        greet: [
          "Ah, bienvenue! Welcome to the Salon de Thé.",
          "Macarons fresh this morning: rose, pistachio, lemon and violet. And the champagne is properly cold.",
        ],
        chat: [
          "The rose macaron is my own recipe. I shall take the secret to my grave.",
          "A little Darjeeling with the mille-feuille, perhaps? The best cure for a long day of shopping.",
        ],
      },
      {
        role: "waitress", name: "Miss Rose Tilly", title: "Waitress, Salon de Thé",
        look: { sex: "f", height: 1.58, skin: "#f2d6c4", eyes: "#4a6a4a", hair: "#a8552a", hairStyle: "curly", outfit: "gown", sleeves: "fitted",
          colours: { dress: "#1a1a1c", blouse: "#1a1a1c", collar: "#ffffff", cuff: "#ffffff" }, extras: ["apron", "cap"], holds: "tray" },
        voice: { gender: "f", pitch: 1.35, rate: 1.12 },
        greet: [
          "Oh, hello! Sit wherever you like, and I'll bring a menu straight over.",
          "If you've a sweet tooth, the cake stands by the banquettes are fair groaning.",
        ],
        chat: [
          "Mind, the strawberry cake goes quick of an afternoon!",
          "Tea, lemonade, or a glass of something sparkling? Monsieur Rey will have it ready in a jiffy.",
        ],
      },
      {
        role: "salon", name: "Mrs. Eleanor Vane", title: "Senior Saleswoman, Grand Salon",
        look: { sex: "f", height: 1.7, skin: "#e9c7ad", eyes: "#5a5a6a", hair: "#9a9088", hairStyle: "chignon", outfit: "gown",
          colours: { dress: "#4a2a4a", blouse: "#4a2a4a", silk: true, collar: "#efe6d6", accent: "#2a1a2a" }, extras: ["pearls", "pince-nez"] },
        voice: { gender: "f", pitch: 0.95, rate: 0.92 },
        greet: [
          "Good day, and welcome to the Grand Salon.",
          "Do sit at either counter, and I shall bring out whatever you wish to see. Watches, signet rings, a little something enamelled.",
        ],
        chat: [
          "Our Winter Garden is just through the gallery, should you like some air among the orange trees.",
          "Each piece here is examined twice: once by our goldsmith, and once by me.",
        ],
      },
      {
        role: "salon2", name: "Mr. Theodore Hart", title: "Clerk, Grand Salon",
        look: { sex: "m", height: 1.8, build: 0.96, skin: "#8a5a3c", eyes: "#2a1a10", hair: "#141010", hairStyle: "crop", outfit: "morning",
          colours: { coat: "#38383e", vest: "#9a8a6a", trousers: "#55555a", tie: "#2e3e5e" }, extras: ["watchchain"] },
        voice: { gender: "m", pitch: 1.1, rate: 1.0 },
        greet: [
          "Good afternoon! Welcome to the first floor.",
          "Our rarest pieces are kept upstairs in the Salon Privé. Just ask, and I'll gladly take you up.",
        ],
        chat: [
          "Mrs. Vane has been with the house thirty years. There's nothing she can't tell you about a stone.",
          "The light in the Salon Privé comes straight down through a glass lantern. You've never seen sapphires so blue.",
        ],
        escort: {
          prompt: "May I escort you up to the Salon Privé?",
          start: ["Splendid. After me, please. Just one more flight."],
          arrive: ["Here we are, the private floor. Madame Aubert will receive you."],
        },
      },
      {
        role: "florist", name: "Miss Ivy Blackwood", title: "Florist, Winter Garden",
        look: { sex: "f", height: 1.66, skin: "#f3dccb", eyes: "#3a5a7a", hair: "#d0a868", hairStyle: "bun", outfit: "gown",
          colours: { dress: "#4a6a4a", blouse: "#f1ece0", collar: "#f1ece0", accent: "#3a2a1a" }, extras: ["apron"], holds: "shears" },
        voice: { gender: "f", pitch: 1.2, rate: 1.05 },
        greet: [
          "Hello there! Welcome to the Winter Garden.",
          "Every flower in the house passes through my hands each morning: the peonies, the roses, the orchids on the counters. Do have a wander.",
        ],
        chat: [
          "The orange trees winter in here, just as they do at Versailles.",
          "Sit by the fountain a while and the sun moves right across the tiles. It's my favourite hour.",
        ],
      },
      {
        role: "vipHost", name: "Madame Séverine Aubert", title: "Hostess, Salon Privé",
        look: { sex: "f", height: 1.72, skin: "#c99272", eyes: "#2a1a10", hair: "#120e0c", hairStyle: "pompadour", outfit: "gown",
          colours: { dress: "#1d2a4a", blouse: "#1d2a4a", silk: true, collar: "#1d2a4a", accent: "#c9a24a" }, extras: ["pearls", "gloves"] },
        voice: { gender: "f", pitch: 0.9, rate: 0.9, accent: "fr" },
        greet: [
          "Bonjour, and welcome to the private floor.",
          "Here we show the house's rarest pieces, by appointment only. For you, of course, the door is open. Monsieur Pell is waiting inside.",
        ],
        chat: [
          "Champagne is poured by the fire, whenever you wish.",
          "The pearl sautoir in the tower belonged, they say, to a Russian grand duchess.",
        ],
      },
      {
        role: "director", name: "Mr. Ambrose Pell", title: "Director, Salon Privé",
        look: { sex: "m", height: 1.76, skin: "#ecc8b0", eyes: "#4a5a6a", hair: "#d9d4cc", hairStyle: "side", facial: "moustache", outfit: "frock",
          colours: { coat: "#1a1a20", vest: "#5b1f2b", trousers: "#2a2a2e", tie: "#2a2a3a" }, extras: ["spectacles", "watchchain"], holds: "loupe" },
        voice: { gender: "m", pitch: 0.8, rate: 0.88 },
        greet: [
          "{tod}. Ambrose Pell, at your service. Welcome to the Salon Privé.",
          "Every piece in this room has passed beneath my own glass. Sit by the fire, or come to the desk and I shall show you the sapphire.",
        ],
        chat: [
          "Look at the stone when the sun comes through the lantern. That is the true test of a sapphire.",
          "We have dressed duchesses and opera singers, and once, I am told, a very fortunate governess.",
        ],
      },
    ],

    // area: display (ground floor) | salon (first floor) | vip (second floor). feature: the star piece of that room.
    items: [
      { kind: "tiara", area: "display", feature: true, name: "Belle Époque garland tiara", note: "Platinum garlands, old-cut diamonds and sapphire drops. It sat on a duchess's head at the Opéra." },
      { kind: "riviere", area: "display", name: "Diamond rivière necklace", note: "Twenty-nine stones, each a little larger toward the centre, like a river widening." },
      { kind: "bowbrooch", area: "display", name: "Diamond bow brooch", note: "A ribbon tied in platinum. Pin it at the throat, or on a velvet hat." },
      { kind: "emeraldDrops", area: "display", name: "Emerald drop earrings", note: "Step-cut Colombian emeralds beneath diamond tops. They catch every candle in the room." },
      { kind: "lineBracelets", area: "display", name: "Diamond & ruby line bracelets", note: "Wear one alone, or both together. Most ladies choose both." },
      { kind: "garnets", area: "salon", name: "Garnet & seed-pearl necklace", note: "Bohemian garnets with a fringe of seed pearls. A great favourite of the house." },
      { kind: "hunter", area: "salon", name: "Gentleman's gold hunter watch", note: "Eighteen-carat case, Swiss movement. It keeps better time than the Westminster clock. Nearly." },
      { kind: "signet", area: "salon", name: "Gold signet ring & cufflinks", note: "We can engrave your crest or your initials. Ready within the week." },
      { kind: "pansy", area: "salon", name: "Enamelled pansy brooch", note: "Pansy, from the French 'pensée', a thought. A brooch to say you are thinking of someone." },
      { kind: "lapelwatch", area: "salon", name: "Lady's enamel lapel watch", note: "Guilloché blue enamel under a ring of diamonds. Pinned on, it is a jewel and a clock at once." },
      { kind: "sautoir", area: "vip", feature: true, name: "Natural pearl sautoir", note: "Every pearl matched by hand over eleven years. They say it belonged to a grand duchess." },
      { kind: "ring", area: "vip", feature: true, name: "Sapphire & diamond cluster ring", note: "A Ceylon sapphire of rare cornflower blue, ringed with diamonds. The finest stone in the house." },
      { kind: "choker", area: "vip", name: "Pearl dog-collar choker", note: "Five rows of pearls and a diamond plaque, worn high on the neck as the Princess of Wales does." },
      { kind: "aigrette", area: "vip", name: "Diamond aigrette with plume", note: "For the hair, at a ball. The ruby sits just above the brow." },
    ],
  },
  {
    id: "charms",
    side: "right", slot: 0,
    sign: "THE CHARM CABINET", subsign: "Charms · Lockets · Trinkets",
    front: "#4a2340", trim: "#e2c27a", wall: "stucco", wallpaper: "#5e3554",
    awning: "#7b3b6b", upper: "plain",
    link: RC.LINKS.etsy,
    keeper: {
      name: "Miss Clara Finch", look: "f",
      dress: "#3b5a7a", blouse: "#f1e8da", hair: "#8a4b2a",
    },
    greeting: [
      "Oh! {tod} to you. Mind the bell, it does make such a racket.",
      "Welcome to the Charm Cabinet. Lucky horseshoes, little hearts, tiny keys to secret places... a charm for every fancy, I always say.",
      "Do have a good rummage. I shan't hurry you one bit.",
    ],
    farewell: "Ta-ta for now! May your new charms bring you nothing but good fortune.",
    items: [
      { kind: "locket", name: "Heart locket", note: "It opens, you know. Room inside for a photograph, or a curl of someone's hair." },
      { kind: "horseshoe", name: "Lucky horseshoe charm", note: "Points upward, mind, or all the luck runs straight out." },
      { kind: "key", name: "Little brass key", note: "Nobody knows what it opens. That's rather the charm of it." },
      { kind: "bracelet", name: "Charm bracelet", note: "Seven charms already, and room for plenty more." },
      { kind: "jar", name: "Jar of loose charms", note: "Odds and ends, a penny a dip. Go on, have a look." },
    ],
  },
  {
    id: "home",
    side: "left", slot: 1,
    sign: "ROSECAT HOME", subsign: "Furnishings & Décor for the Home",
    front: "#6b1e1e", trim: "#e0b867", wall: "yellow", wallpaper: "#7a3b2e",
    awning: "#2f5b3a", upper: "arched",
    link: RC.LINKS.ebay,
    keeper: {
      name: "Mrs. Harriet Bramble", look: "f",
      dress: "#4b3a2a", blouse: "#e9dfcf", hair: "#5a4a3a", apron: true,
    },
    greeting: [
      "{tod}, and welcome. Come in, come in, you're letting the damp in.",
      "Lamps, looking-glasses, vases fit for a duchess's drawing room... everything a respectable home could wish for.",
      "Have a wander about, and do give a call if you'd like anything taken down from the high shelves.",
    ],
    farewell: "Mind how you go, dear. And do remember us when the parlour wants brightening.",
    items: [
      { kind: "lamp", name: "Brass table lamp", note: "Converted for the new electric light, if you're so modern. Or oil, if you're not." },
      { kind: "vase", name: "Glazed porcelain vase", note: "Hand-painted. Not a chip on her, I've checked twice." },
      { kind: "clock", name: "Mantel clock", note: "Chimes the quarter hours. Rather comforting of an evening." },
      { kind: "mirror", name: "Gilt looking-glass", note: "Lovely old mercury glass. Makes any hallway look twice the size." },
      { kind: "candlestick", name: "Pair of candlesticks", note: "Solid brass. You could fend off a burglar with one." },
    ],
  },
  {
    id: "clothing",
    side: "right", slot: 1,
    sign: "ROSECAT DRAPERS", subsign: "Ladies' & Gentlemen's Outfitters",
    front: "#1f2c4d", trim: "#d9b56a", wall: "brick", wallpaper: "#33405e",
    awning: null, upper: "bay",
    link: RC.LINKS.etsy,
    keeper: {
      name: "Mr. Edmund Ashworth", look: "m",
      coat: "#2d2a26", vest: "#6d6250", hair: "#3a2a1e", moustache: true, tape: true,
    },
    greeting: [
      "{tod}! Welcome, welcome. You find us with a fresh delivery this very week.",
      "Walking dresses, tailored jackets, a fine overcoat for the season. All pressed and brushed, every one.",
      "Look about at your leisure. Should you wish to try anything, the fitting room is just through the curtain.",
    ],
    farewell: "A very good day to you. You'll be the best-dressed soul on the Lane.",
    items: [
      { kind: "dressform", name: "Embroidered day dress", note: "Silk and wool, and look at that needlework at the cuff. A true beauty." },
      { kind: "bolt", name: "Bolt of fine wool", note: "From a mill in Yorkshire. Feel the weight of it." },
      { kind: "coat", name: "Tailored overcoat", note: "Double-breasted. Keeps out the worst a London winter can throw." },
      { kind: "folded", name: "Linen shirts", note: "Freshly laundered and starched. Collars sold separately, naturally." },
    ],
  },
  {
    id: "accessories",
    side: "left", slot: 2,
    sign: "ROSECAT HABERDASHERY", subsign: "Hats · Gloves · Parasols · Sundries",
    front: "#7a5a18", trim: "#f0d48a", wall: "stucco", wallpaper: "#6b5a2a",
    awning: "#8a2a2a", upper: "pediment",
    link: RC.LINKS.ebay,
    keeper: {
      name: "Mrs. Lavinia Carrow", look: "f",
      dress: "#2a4a3a", blouse: "#efe6d6", hair: "#2a1e18",
    },
    greeting: [
      "{tod}, and welcome to Rosecat Haberdashery.",
      "A lady or gentleman is never truly dressed without the proper hat and gloves. We have both, and a good deal more besides.",
      "Do try anything you fancy. The looking-glass is just there by the window.",
    ],
    farewell: "Good day! Wear it well, and wear it often.",
    items: [
      { kind: "tophat", name: "Silk top hat", note: "Brushed silk plush. Quite the thing for an evening at the theatre." },
      { kind: "boater", name: "Straw boater", note: "Perfect for a summer's day on the river at Henley." },
      { kind: "gloves", name: "Kid leather gloves", note: "Soft as butter. Buttoned at the wrist, as is proper." },
      { kind: "umbrella", name: "Silk parasol", note: "Ivory handle and a lace trim. Keeps off sun and drizzle alike." },
      { kind: "handbag", name: "Beaded reticule", note: "Every bead stitched by hand. Just large enough for calling cards." },
    ],
  },
  {
    id: "curios",
    side: "right", slot: 2,
    sign: "CURIOSITIES", subsign: "Antiques, Oddments & Collectibles",
    front: "#1a1a1a", trim: "#c8a04a", wall: "yellow", wallpaper: "#3a3226",
    awning: null, upper: "arched",
    link: RC.LINKS.ebay,
    keeper: {
      name: "Mr. Silas Quill", look: "m",
      coat: "#3a2e24", vest: "#2a3a2a", hair: "#e6e2da", moustache: true, spectacles: true,
    },
    greeting: [
      "{tod}. Mind the step, and mind the stuffed owl. He bites.",
      "Curiosities from every corner of the Empire, and a few corners beyond it. Globes, gramophones, books nobody has read in a century.",
      "Touch whatever you like. Most of it has survived far worse than you.",
    ],
    farewell: "Farewell, farewell. Something in here will call you back, mark my words.",
    items: [
      { kind: "globe", name: "Terrestrial globe", note: "A few of those borders have moved since it was made. Such is the way of the world." },
      { kind: "gramophone", name: "Horn gramophone", note: "Still plays, if you give the handle a good wind." },
      { kind: "books", name: "Stack of old books", note: "Poetry, a sea atlas, and a rather scandalous novel. I shan't say which." },
      { kind: "telescope", name: "Brass telescope", note: "From a ship's captain, apparently. You can see clear to Greenwich on a fine day." },
      { kind: "birdcage", name: "Gilded birdcage", note: "Empty, I'm afraid. The canary had other plans." },
    ],
  },
];
