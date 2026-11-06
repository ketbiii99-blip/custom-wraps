// Maintenance commands:
//   node server/cli.js import <file.json>   add offers from a file to the review queue
//   node server/cli.js clear-demo           delete all demo offers (do this before launch)
//   node server/cli.js stats                count offers by status and source
const fs = require("node:fs");
const { open } = require("./db");
const { seed } = require("./seed");
const { importOffers } = require("./server");

const [cmd, arg] = process.argv.slice(2);
const db = open();
seed(db);

if (cmd === "import") {
  if (!arg) { console.error("Usage: node server/cli.js import <file.json>"); process.exit(1); }
  const admin = db.prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1").get();
  const r = importOffers(db, JSON.parse(fs.readFileSync(arg, "utf8")), admin.id);
  console.log(`Added ${r.added} offers to the review queue. Skipped ${r.skipped.length}.`);
  r.skipped.forEach((s) => console.log(`  - #${s.index} ${s.product}: ${s.reason}`));
} else if (cmd === "clear-demo") {
  const r = db.prepare("DELETE FROM offers WHERE source_type = 'demo'").run();
  db.prepare("DELETE FROM products WHERE id NOT IN (SELECT product_id FROM offers)").run();
  console.log(`Deleted ${r.changes} demo offers.`);
} else if (cmd === "stats") {
  console.table(db.prepare("SELECT status, source_type, COUNT(*) n FROM offers GROUP BY 1, 2 ORDER BY 1, 2").all());
} else {
  console.log("Commands: import <file.json> | clear-demo | stats");
}
