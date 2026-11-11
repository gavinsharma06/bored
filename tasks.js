// Edit by hand. Every task needs a unique id, a category id from CATEGORIES,
// a short wheel label, the full instruction, minutes, and the moods it shows up in.
// Moods: "fried", "meh", "lockedIn".

const CATEGORIES = [
  { id: "coolGuy", name: "Cool Guy Arc", icon: "🎸", color: "#e2412c" },
  { id: "unfinished", name: "Unfinished Business", icon: "📖", color: "#f2b631" },
  { id: "brain", name: "Brain", icon: "🧠", color: "#2c4fa3" },
  { id: "prFuel", name: "PR Fuel", icon: "🗣️", color: "#e86a92" },
  { id: "body", name: "Body", icon: "🏋️", color: "#1d7f78" },
  { id: "lifeControl", name: "Life Control", icon: "🪴", color: "#fbe9c6" },
  { id: "kitchen", name: "Kitchen Quest", icon: "🍳", color: "#f08a24" },
  { id: "games", name: "Guilt Free Games", icon: "🎮", color: "#7b3f8c" },
  { id: "movie", name: "Feel Good Movie", icon: "📺", color: "#5f9e3f" },
  { id: "chaos", name: "Chaos", icon: "🎱", color: "#1b1b1b", ignoresNeglect: true },
  { id: "reels", name: "Reels", icon: "📱", color: "#33c3e0", ignoresNeglect: true }
];

const TASKS = [
  {
    id: "sketchDesk",
    category: "coolGuy",
    label: "Desk sketch",
    text: "Sketch whatever is on your desk in pencil for 10 minutes. No erasing allowed.",
    minutes: 10,
    moods: ["fried", "meh", "lockedIn"]
  },
  {
    id: "chordDrill",
    category: "coolGuy",
    label: "Chord drill",
    text: "Play the hardest chord in the song you're learning 20 times, slowly and cleanly.",
    minutes: 8,
    moods: ["meh", "lockedIn"]
  },
  {
    id: "paperCrane",
    category: "coolGuy",
    label: "Paper crane",
    text: "Fold one paper crane from a sheet of printer paper. Follow the first video tutorial you find.",
    minutes: 10,
    moods: ["fried", "meh"]
  },
  {
    id: "nextPages",
    category: "unfinished",
    label: "Next 5 pages",
    text: "Read the next 5 pages of the book closest to your bed. Move the bookmark.",
    minutes: 10,
    moods: ["fried", "meh", "lockedIn"]
  },
  {
    id: "savedArticle",
    category: "unfinished",
    label: "Saved article",
    text: "Open the oldest article in your read later list and read it to the end.",
    minutes: 10,
    moods: ["meh", "lockedIn"]
  },
  {
    id: "onePoem",
    category: "unfinished",
    label: "One poem",
    text: "Read one poem out loud, twice. The second time, slower.",
    minutes: 3,
    moods: ["fried", "meh"]
  },
  {
    id: "codingPuzzle",
    category: "brain",
    label: "Code puzzle",
    text: "Solve one easy coding puzzle. Take the first unsolved one in the list.",
    minutes: 10,
    moods: ["meh", "lockedIn"]
  },
  {
    id: "mentalMath",
    category: "brain",
    label: "Mental math",
    text: "Multiply ten pairs of two digit numbers in your head, then check them with a calculator.",
    minutes: 8,
    moods: ["meh", "lockedIn"]
  },
  {
    id: "explainIt",
    category: "brain",
    label: "Explain it",
    text: "Explain one idea from your work or classes out loud as if to a ten year old, for 5 minutes.",
    minutes: 5,
    moods: ["lockedIn"]
  },
  {
    id: "languageApp",
    category: "prFuel",
    label: "Language app",
    text: "10 minutes in your language learning app. Keep the streak alive.",
    minutes: 10,
    moods: ["fried", "meh", "lockedIn"]
  },
  {
    id: "labelRoom",
    category: "prFuel",
    label: "Label the room",
    text: "Name 10 things in your room in the language you're learning. Look up the ones you miss.",
    minutes: 10,
    moods: ["meh", "lockedIn"]
  },
  {
    id: "countAloud",
    category: "prFuel",
    label: "Count to 100",
    text: "Count from 1 to 100 out loud in the language you're learning. Restart each ten you stall on.",
    minutes: 8,
    moods: ["fried", "meh"]
  },
  {
    id: "pushUps",
    category: "body",
    label: "Push ups",
    text: "4 sets of 8 push ups, knees down if you need to. 1 minute rest between sets.",
    minutes: 8,
    moods: ["meh", "lockedIn"]
  },
  {
    id: "stretch",
    category: "body",
    label: "Stretch",
    text: "Stretch hamstrings, hips, and shoulders for 1 minute each, twice through.",
    minutes: 6,
    moods: ["fried", "meh"]
  },
  {
    id: "boxBreathing",
    category: "body",
    label: "Box breathing",
    text: "Sit on the floor and box breathe for 5 minutes: in 4, hold 4, out 4, hold 4.",
    minutes: 5,
    moods: ["fried", "meh", "lockedIn"]
  },
  {
    id: "wallSit",
    category: "body",
    label: "Wall sit",
    text: "Three 45 second wall sits with 45 seconds rest between them.",
    minutes: 5,
    moods: ["meh", "lockedIn"]
  },
  {
    id: "waterPlants",
    category: "lifeControl",
    label: "Water plants",
    text: "Water every plant until it drips out the bottom. Turn each one a quarter turn.",
    minutes: 3,
    moods: ["fried", "meh"]
  },
  {
    id: "fridgeList",
    category: "lifeControl",
    label: "Fridge list",
    text: "Write down everything in the fridge, oldest first. Circle whatever expires this week.",
    minutes: 10,
    moods: ["meh", "lockedIn"]
  },
  {
    id: "outfitPrep",
    category: "lifeControl",
    label: "Outfit prep",
    text: "Lay out tomorrow's clothes on a chair. Socks included.",
    minutes: 3,
    moods: ["fried", "meh", "lockedIn"]
  },
  {
    id: "cableTidy",
    category: "lifeControl",
    label: "Cable tidy",
    text: "Untangle and coil every cable on your desk, then put back only the ones you use.",
    minutes: 10,
    moods: ["fried", "meh"]
  },
  {
    id: "alarmSet",
    category: "lifeControl",
    label: "Alarm set",
    text: "Set tomorrow's alarm now and put your phone on charge across the room tonight.",
    minutes: 2,
    moods: ["fried", "meh", "lockedIn"]
  },
  {
    id: "eggsOnToast",
    category: "kitchen",
    label: "Eggs on toast",
    text: "Scramble two eggs on low heat and put them on buttered toast.",
    minutes: 10,
    moods: ["fried", "meh"]
  },
  {
    id: "grilledCheese",
    category: "kitchen",
    label: "Grilled cheese",
    text: "Make a grilled cheese: butter on the outside, low heat, flip once.",
    minutes: 10,
    moods: ["fried", "meh"]
  },
  {
    id: "lunchPrep",
    category: "kitchen",
    label: "Lunch prep",
    text: "Pack tomorrow's lunch tonight and put it in the fridge with your name on it.",
    minutes: 10,
    moods: ["meh", "lockedIn"]
  },
  {
    id: "oneLevel",
    category: "games",
    label: "One level",
    text: "Play one level or one match of the game you're into right now. Then stop.",
    minutes: 10,
    moods: ["fried", "meh"]
  },
  {
    id: "cozyDay",
    category: "games",
    label: "Cozy day",
    text: "Play one in game day of a cozy game. Go to bed early so it stays short.",
    minutes: 10,
    moods: ["fried", "meh"]
  },
  {
    id: "dailyPuzzle",
    category: "games",
    label: "Daily puzzle",
    text: "Do today's daily puzzle in any puzzle app.",
    minutes: 5,
    moods: ["fried", "meh", "lockedIn"]
  },
  {
    id: "comfortMovie",
    category: "movie",
    label: "Comfort movie",
    text: "Watch the first 10 minutes of your favourite comfort movie. Continuing is allowed.",
    minutes: 10,
    moods: ["fried", "meh"]
  },
  {
    id: "nextEpisode",
    category: "movie",
    label: "Next episode",
    text: "Watch one episode of the feel good show you're halfway through.",
    minutes: 24,
    moods: ["fried", "meh"]
  },
  {
    id: "standUp",
    category: "movie",
    label: "Stand-up",
    text: "Watch 10 minutes of a stand-up special you haven't seen.",
    minutes: 10,
    moods: ["fried", "meh"]
  },
  {
    id: "magic8Ball",
    category: "chaos",
    label: "Magic 8 Ball",
    text: "Shake a Magic 8 Ball, or any 8 ball app, and ask: should I spin again? Its word is final.",
    minutes: 1,
    moods: ["fried", "meh", "lockedIn"]
  },
  {
    id: "cleanSlate",
    category: "chaos",
    label: "Clean slate",
    text: "Clear your desk completely, then write one sentence: what tomorrow is for.",
    minutes: 5,
    moods: ["fried", "meh", "lockedIn"]
  },
  {
    id: "reels",
    category: "reels",
    label: "10 min reels",
    text: "10 minutes of reels. Set a timer first. When it rings, the phone goes face down.",
    minutes: 10,
    moods: ["fried", "meh"]
  }
];

const PENALTY_TASK = {
  id: "penaltyLeetcode",
  category: "reels",
  label: "Penalty",
  text: "40 min LeetCode, the wheel is disappointed in you.",
  minutes: 40
};

const TREATS = [
  "Order the good bubble tea. Large. Extra pearls.",
  "One full episode of anything. Zero productivity required.",
  "A nap. Officially sanctioned by the network.",
  "Takeout for dinner. The wheel insists.",
  "Buy the thing in your cart under $20.",
  "An hour of any game, no timer, no guilt."
];
