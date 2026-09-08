import { eq } from "drizzle-orm";
import { categories, paymentSettings, products, users } from "../drizzle/schema";
import { getDb } from "./db";

const sampleCategories = [
  { name: "Source Code", slug: "source-code", description: "Production-ready modules and components." },
  { name: "AI Prompts", slug: "ai-prompts", description: "Curated prompt systems for faster creative work." },
  { name: "Full Projects", slug: "full-projects", description: "Complete launch-ready products and starter kits." },
];

const sampleProducts = [
  { title: "SaaS Starter Kit", slug: "saas-starter-kit", type: "PROJECT" as const, shortDescription: "Ship your next subscription product with a polished auth and billing foundation.", description: "A full-stack SaaS foundation designed for small teams. Includes auth flows, billing-ready account pages, onboarding, and a clean admin surface.", price: 2499, discountPrice: 1799, thumbnailUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=85", techStack: ["React", "Node.js", "Postgres"], fileUrl: "/manus-storage/devmarket/saas-starter-kit.zip", isFeatured: true },
  { title: "PromptOps Playbook", slug: "promptops-playbook", type: "PROMPT" as const, shortDescription: "A practical library of prompts for research, writing, and product workflows.", description: "A deeply organized prompt library with reusable variables, evaluation checklists, and workflows for teams that want consistent AI output.", price: 799, discountPrice: 599, thumbnailUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=85", techStack: ["GPT-4", "Claude", "Notion"], fileUrl: "/manus-storage/devmarket/promptops-playbook.pdf", isFeatured: true },
  { title: "Command Palette UI", slug: "command-palette-ui", type: "SOURCE_CODE" as const, shortDescription: "A keyboard-first command menu with smooth motion and accessible interactions.", description: "Drop-in command palette components with fuzzy search, keyboard navigation, shortcuts, themes, and thoughtful empty states.", price: 1299, discountPrice: null, thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=900&q=85", techStack: ["TypeScript", "Tailwind", "Radix UI"], fileUrl: "/manus-storage/devmarket/command-palette-ui.zip", isFeatured: true },
];

async function seed() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL is not configured");
  for (const category of sampleCategories) {
    await db.insert(categories).values(category).onDuplicateKeyUpdate({ set: { description: category.description } });
  }
  const rows = await db.select().from(categories);
  for (const product of sampleProducts) {
    const category = rows.find(row => row.slug === (product.type === "SOURCE_CODE" ? "source-code" : product.type === "PROMPT" ? "ai-prompts" : "full-projects"));
    if (!category) continue;
    await db.insert(products).values({ ...product, categoryId: category.id, previewImages: [product.thumbnailUrl], demoUrl: "https://demo.devmarket.local", isPublished: true, isFeatured: product.isFeatured, salesCount: product.type === "PROJECT" ? 42 : product.type === "PROMPT" ? 31 : 18 }).onDuplicateKeyUpdate({ set: { title: product.title, price: product.price, discountPrice: product.discountPrice, thumbnailUrl: product.thumbnailUrl } });
  }
  await db.insert(users).values({ openId: "devmarket-demo-admin", name: "DevMarket Admin", email: "admin@devmarket.local", loginMethod: "seed", role: "admin" }).onDuplicateKeyUpdate({ set: { role: "admin" } });
  const existingSettings = await db.select().from(paymentSettings).limit(1);
  if (!existingSettings[0]) await db.insert(paymentSettings).values({ upiId: "devmarket@upi", payeeName: "DevMarket Labs", isRazorpayEnabled: true, isManualQrEnabled: true, qrCodeImageUrl: "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&w=600&q=85" });
  console.log("DevMarket seed complete");
}

seed().catch(error => { console.error(error); process.exit(1); });
