// generateEventsSQL.ts

type EventInput = {
  name: string;
  type: string;
};

const events: EventInput[] = [
  { name: "RoboWars", type: "flagship" },
  { name: "Sky Symphony", type: "flagship" },
  { name: "Drone Racing competition", type: "flagship" },
  { name: "WaveQuest", type: "flagship" },
  { name: "Reverse Engineering Challenge", type: "flagship" },
  { name: "Game Jam", type: "flagship" },
  { name: "Vashisht Hackathon 3.O", type: "flagship" },
  { name: "Capture The Flag", type: "flagship" },
  { name: "Pitch on Pitch", type: "flagship" },
  { name: "Luminary Talks", type: "flagship" },
  { name: "IEEE Paper Presentation", type: "flagship" },
  { name: "Triathlon", type: "flagship" },
  { name: "MazeRover", type: "flagship" },
  { name: "Line Follower Robot Competition", type: "tech_formal" },
  { name: "AERO INNOVATION CHALLENGE", type: "tech_formal" },
  { name: "PAPER PLANE AERODYNAMICS CHALLENGE", type: "tech_informal" },
  { name: "CADverse – 3D Modelling Challenge", type: "tech_formal" },
  { name: "Motorsport Trivia & Race Strategy", type: "tech_informal" },
  { name: "Discover the Thrill of Racing Engineering", type: "tech_informal" },
  { name: "Social Media Challenge – “Fuel the Fest”", type: "tech_informal" },
  { name: "AquaRace: AUV Simulator Challenge", type: "tech_formal" },
  { name: "Robo-Soccer", type: "tech_formal" },
  { name: "BIT-TRIX", type: "tech_formal" },
  { name: "ElectroCraft", type: "tech_informal" },
  { name: "Lens & Logic", type: "tech_formal" },
  { name: "BACKEND BREAKDOWN", type: "tech_formal" },
  { name: "CODE RELAY", type: "tech_informal" },
  { name: "Hack & Shield", type: "tech_formal" },
  { name: "Ricing & Scripting Competition", type: "tech_formal" },
  {
    name: "CHRONO QUEST – The Time-Travel Treasure Hunt",
    type: "tech_informal",
  },
  { name: "Raise Your Standards", type: "tech_formal" },
  { name: "MIND MAZE", type: "tech_informal" },
  { name: "AlgoXchange", type: "tech_formal" },
  { name: "OPCODE", type: "tech_formal" },
  { name: "CodeHunt", type: "tech_informal" },
  { name: "VIVADHAM – The Classic Clash of Voices", type: "cult_formal" },
  { name: "“One Line • One Rhythm”", type: "cult_formal" },
  { name: "THEATRICAL ODYSSEY--THE PRICE OF PLEASURE", type: "cult_formal" },
  { name: "KONJAM NADINGA BOSS", type: "cult_informal" },
  { name: "Fragments of Time", type: "cult_formal" },
  { name: "Savāra Flagship Quiz", type: "cult_formal" },
  { name: "Temporal wishpers", type: "cult_formal" },
  { name: "Battle of Bands", type: "cult_flagship" },
  { name: "Solos - Vocals and Instrumentals", type: "cult_formal" },
  { name: "spotlight", type: "cult_formal" },
  { name: "Free Fire", type: "cult_formal" },
  { name: "BGMI", type: "cult_formal" },
  { name: "Valorant", type: "cult_formal" },
  { name: "prism", type: "cult_formal" },
  { name: "Spectrum: ONE MINUITE EDITION", type: "cult_flagship" },
  { name: "Groovy Moovy", type: "cult_flagship" },
  { name: "FRAME PAARUNGA JI", type: "cult_informal" },
  { name: "FACE PAINTING", type: "cult_informal" },
  { name: "tambola", type: "cult_informal" },
  { name: "Storycraft", type: "cult_informal" },
  { name: "Dance Dumb Charades", type: "cult_informal" },
  { name: "Open Floor / DJ Dance", type: "cult_informal" },
  { name: "Experience the Thrill!", type: "cult_informal" },
  { name: "Judge the book by its cover", type: "cult_informal" },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

function generateSQL(events: EventInput[]): string {
  const values = events.map((event) => {
    const name = escapeSQL(event.name);
    const slug = slugify(event.name);
    return `(gen_random_uuid(),'${name}','${slug}',1,50,true,NOW())`;
  });

  return `INSERT INTO events (id, name, slug, team_min_size, team_max_size, is_active, created_at) VALUES ${values.join(",")};`;
}

// run
const sql = generateSQL(events);
console.log(sql);
