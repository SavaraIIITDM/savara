import fs from "node:fs";
import path from "node:path";

const filePath = path.resolve(process.cwd(), "src/data/event_list.json");
const events = JSON.parse(fs.readFileSync(filePath, "utf-8"));

if (!Array.isArray(events) || events.length === 0) {
  throw new Error("event_list.json is empty or invalid");
}

const escapeLiteral = (value) => String(value).replaceAll("'", "''");

const values = events
  .map((event) => {
    return `('${escapeLiteral(event.name)}', '${escapeLiteral(event.slug)}', ${Number(event.team_min_size)}, ${Number(event.team_max_size)}, true)`;
  })
  .join(",\n  ");

const sql = `insert into public.events (name, slug, team_min_size, team_max_size, is_active)
values
  ${values}
on conflict (slug)
do update set
  name = excluded.name,
  team_min_size = excluded.team_min_size,
  team_max_size = excluded.team_max_size,
  is_active = excluded.is_active;`;

process.stdout.write(sql);
