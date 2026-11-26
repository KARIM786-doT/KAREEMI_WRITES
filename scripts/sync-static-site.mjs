import { cpSync, copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = resolve(projectRoot, "public");
const htmlFiles = [
  "about.html",
  "book-details.html",
  "categories.html",
  "contact.html",
  "index.html",
  "library.html",
  "login.html",
  "reader.html",
  "services.html",
  "robots.txt",
  "sitemap.xml",
];
const directories = ["admin", "assets", "css", "js"];

for (const file of htmlFiles) {
  const destination = resolve(publicRoot, file);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(resolve(projectRoot, file), destination);
}

for (const directory of directories) {
  cpSync(resolve(projectRoot, directory), resolve(publicRoot, directory), {
    recursive: true,
  });
}
