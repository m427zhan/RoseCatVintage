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
    sign: "ROSECAT & Co.", subsign: "Fine Jewellers & Goldsmiths",
    front: "#1d3b2a", trim: "#d4af5a", wall: "brick", wallpaper: "#2f4a3a",
    awning: null, upper: "pediment",
    link: RC.LINKS.etsy,
    keeper: {
      name: "Mr. Ambrose Pell", look: "m",
      coat: "#22222a", vest: "#5b1f2b", hair: "#c9c4bc", moustache: true, spectacles: true,
    },
    greeting: [
      "{tod}, and welcome to Rosecat & Company. Do step in out of that dreadful fog.",
      "Every piece in these cases has passed beneath my own glass. I would vouch for each stone as I would for my own good name.",
      "Pray, take your time. Should anything catch your eye, you need only take it up and I shall tell you all about it.",
    ],
    farewell: "Good day to you, and do call again. My cases are always open to a discerning eye.",
    items: [
      { kind: "bust", name: "Pearl & garnet necklace", note: "Ah, the garnets. A lady in Mayfair wore that to the opera, or so I'm told." },
      { kind: "ringbox", name: "Gold signet ring", note: "Eighteen-carat, and the engraving still crisp as the day it was cut." },
      { kind: "watch", name: "Gentleman's pocket watch", note: "Keeps better time than the Westminster clock, I'll wager. Well, nearly." },
      { kind: "brooch", name: "Cameo brooch", note: "Hand-carved shell. They don't make them with such patience any more." },
      { kind: "earrings", name: "Drop earrings", note: "Paste, I'll be honest with you, but very good paste indeed." },
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
