// An example of the profile a data repo keeps next to its tasks. Whoever writes
// new tasks reads it: every task should serve the vision, use only things in
// inventory, and avoid anything in doesNotOwn or dislikes. The app never loads it.

const PROFILE = {
  oneYearVision: [
    "Wakes up on time",
    "Sleeps on a steady schedule",
    "Reads most days",
    "Plays an instrument comfortably",
    "Holds a basic conversation in a second language",
    "Stronger and more flexible",
    "Ships one side project"
  ],
  inventory: [
    "A guitar",
    "A few unfinished books",
    "A laptop",
    "A tablet",
    "A yoga mat",
    "A resistance band",
    "A frying pan and a toaster",
    "House plants",
    "A notebook and pens"
  ],
  doesNotOwn: [
    "A car",
    "A gym membership"
  ],
  likes: [
    "Feel good shows",
    "Cozy games",
    "Short walks"
  ],
  dislikes: [
    "Horror",
    "Running"
  ]
};
