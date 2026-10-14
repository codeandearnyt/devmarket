/* ============================================================================
   Developer profile content
   ----------------------------------------------------------------------------
   Every string, list and tag rendered by /developer lives here so the page
   component stays purely presentational and the copy can be edited without
   touching layout code.

   Sections map to the page order:
     HERO            → hero headline, CTAs, headline stats
     STORY           → the "so far" narrative and pull quote
     TECH_STACK      → the marquee
     SKILL_CLUSTERS  → core capabilities (12 skills)
     PORTFOLIO       → selected work (filterable)
     JOURNEY         → learning path timeline
     SERVICES        → how I can help
     NOW_BUILDING    → in-progress work
     AI_APPROACH     → the responsible-AI stance
     PRINCIPLES      → working principles
     FAQ_ITEMS       → questions
     CONTACT         → closing CTA
   ========================================================================== */

import type { LucideIcon } from "lucide-react";
import {
  Accessibility,
  Bot,
  Boxes,
  Brain,
  Braces,
  Database,
  FileText,
  Fingerprint,
  Gauge,
  GitBranch,
  HeartPulse,
  Layers,
  Lightbulb,
  MonitorSmartphone,
  PenTool,
  PencilRuler,
  Rocket,
  Server,
  ShieldCheck,
  ShoppingBag,
  TerminalSquare,
  TestTube2,
  Workflow,
  Zap,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Hero                                                                       */
/* -------------------------------------------------------------------------- */

export const HERO = {
  eyebrow: "Developer profile / 001",
  name: "Nitin",
  nameAccent: "Sharma.",
  headline: "A 16-year-old computer science engineering student exploring the space where automation, AI, and thoughtful product design meet.",
  primaryCta: { label: "Explore capabilities", href: "#work" },
  secondaryCta: { label: "Read the story", href: "#story" },
  portrait: {
    // The source file is a WebP payload. It shipped for a while under a .jpg
    // name, which made the server answer `Content-Type: image/jpeg` for WebP
    // bytes — browsers refuse to decode that, so the portrait rendered at 0×0.
    src: "/assets/DEVELOPER.webp",
    alt: "Portrait of Nitin Sharma",
    badge: "Builder in progress",
    tagline: "Learning. Building. Sharing.",
    stamp: "Made with\ncuriosity",
  },
  /**
   * Headline stats. These are facts about the person, not vanity metrics —
   * add a number here only if it is genuinely true.
   */
  stats: [
    { id: "age", value: "16", label: "Years old" },
    { id: "field", value: "CS", label: "Engineering" },
    { id: "drive", value: "∞", label: "Curiosity" },
  ],
  scrollCue: "Scroll",
} as const;

/* -------------------------------------------------------------------------- */
/* Story                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * `emphasis` names a substring inside `text` that should render in the ink
 * colour rather than the muted body colour. Doing it by name instead of by
 * string surgery means the sentence stays readable and editable in this file.
 */
export type StoryParagraph = { text: string; emphasis?: string };

export const STORY = {
  heading: "A student building beyond the syllabus.",
  paragraphs: [
    {
      text: "My name is Nitin Sharma. I am 16 years old and currently studying Computer Science Engineering at Government Polytechnic Sergarh, Kaithal.",
      emphasis: "Nitin Sharma",
    },
    {
      text: "I enjoy taking a rough idea and turning it into something people can actually use. That can mean automating a repetitive workflow, experimenting with an AI assistant, creating a website, or shaping an app from a blank screen into a clear experience.",
    },
    {
      text: "My focus is not simply to generate more software. It is to learn how technology can be made useful, responsible, and understandable — especially when AI is part of the process.",
    },
  ] satisfies StoryParagraph[],
  pullQuote: "The point is not to ship the most code. It is to ship the thing that actually helps someone.",
} as const;

/* -------------------------------------------------------------------------- */
/* Tech stack marquee                                                         */
/* -------------------------------------------------------------------------- */

export type StackTool = { name: string; /** Simple Icons slug; the SVG lives in /public/logos. */ slug: string };

/** Each `slug` resolves to client/public/logos/<slug>.svg. */
export const TECH_STACK: StackTool[] = [
  { name: "React", slug: "react" },
  { name: "TypeScript", slug: "typescript" },
  { name: "JavaScript", slug: "javascript" },
  { name: "Node.js", slug: "nodedotjs" },
  { name: "Next.js", slug: "nextdotjs" },
  { name: "Tailwind CSS", slug: "tailwindcss" },
  { name: "PostgreSQL", slug: "postgresql" },
  { name: "Drizzle ORM", slug: "drizzle" },
  { name: "tRPC", slug: "trpc" },
  { name: "Express", slug: "express" },
  { name: "MongoDB", slug: "mongodb" },
  { name: "Redis", slug: "redis" },
  { name: "Python", slug: "python" },
  { name: "Firebase", slug: "firebase" },
  { name: "Docker", slug: "docker" },
  { name: "Git", slug: "git" },
  { name: "GitHub", slug: "github" },
  { name: "Vite", slug: "vite" },
  { name: "Netlify", slug: "netlify" },
  { name: "Vercel", slug: "vercel" },
  { name: "Cloudflare", slug: "cloudflare" },
  { name: "Figma", slug: "figma" },
  { name: "Razorpay", slug: "razorpay" },
  { name: "n8n", slug: "n8n" },
];

/* -------------------------------------------------------------------------- */
/* Skills — 16, grouped into 4 clusters                                      */
/* -------------------------------------------------------------------------- */

export type Skill = {
  id: string;
  title: string;
  copy: string;
  tags: string[];
  icon: LucideIcon;
  /**
   * How honestly framed. Deliberately not a percentage: a number would imply a
   * measured proficiency claim that is not backed by anything.
   */
  stage: "Learning" | "Building" | "Shipping";
};

export type SkillCluster = { id: string; title: string; blurb: string; skills: Skill[] };

export const SKILL_CLUSTERS: SkillCluster[] = [
  {
    id: "frontend",
    title: "Frontend engineering",
    blurb: "Interfaces that stay fast, readable and usable on the worst device in the room.",
    skills: [
      {
        id: "react",
        title: "React & TypeScript",
        copy: "Component architecture, typed data boundaries, and state that does not fight itself as the product grows.",
        tags: ["React 19", "TypeScript", "Hooks"],
        icon: Boxes,
        stage: "Shipping",
      },
      {
        id: "responsive",
        title: "Responsive systems",
        copy: "Layouts that hold together from a 320px phone to a wide desktop without a pile of one-off overrides.",
        tags: ["Grid", "Fluid type", "Container queries"],
        icon: MonitorSmartphone,
        stage: "Shipping",
      },
      {
        id: "a11y",
        title: "Accessibility",
        copy: "Semantic markup, visible focus, real keyboard paths, and contrast checked in both themes.",
        tags: ["WCAG AA", "ARIA", "Keyboard"],
        icon: Accessibility,
        stage: "Building",
      },
      {
        id: "motion",
        title: "Motion & interaction",
        copy: "Animation that explains a state change instead of decorating one — always transform and opacity, always cheap.",
        tags: ["Framer Motion", "Transitions", "Reduced motion"],
        icon: Zap,
        stage: "Building",
      },
    ],
  },
  {
    id: "backend",
    title: "Backend & data",
    blurb: "The part under the screen: real data, real auth, real money handling.",
    skills: [
      {
        id: "node",
        title: "Node.js & APIs",
        copy: "Typed request handlers, validation at the boundary, and endpoints that fail loudly instead of quietly.",
        tags: ["Express", "tRPC", "Zod"],
        icon: Braces,
        stage: "Shipping",
      },
      {
        id: "sql",
        title: "Databases & SQL",
        copy: "Schema design, migrations that can be re-run safely, and queries that do not fall over as rows grow.",
        tags: ["PostgreSQL", "Drizzle", "Migrations"],
        icon: Database,
        stage: "Building",
      },
      {
        id: "auth",
        title: "Auth & payments",
        copy: "Session handling, role checks, and checkout flows including the manual path a bank transfer needs.",
        tags: ["Firebase Auth", "Razorpay", "Sessions"],
        icon: Fingerprint,
        stage: "Building",
      },
      {
        id: "deploy",
        title: "Deployment & tooling",
        copy: "Build pipelines, environment variables, and rollbacks that do not require archaeology.",
        tags: ["Vite", "Vercel", "Git"],
        icon: GitBranch,
        stage: "Shipping",
      },
    ],
  },
  {
    id: "ai",
    title: "AI & automation",
    blurb: "Models and pipelines used to remove a manual step — never to hide one from the user.",
    skills: [
      {
        id: "llm-apps",
        title: "LLM applications",
        copy: "Grounding a model in real context, structuring its output, and handling the case where it is simply wrong.",
        tags: ["Structured output", "Tools", "Retrieval"],
        icon: Brain,
        stage: "Building",
      },
      {
        id: "prompts",
        title: "Prompts & evaluation",
        copy: "Treating a prompt like code: versioned, tested against real cases, and changed only when a case fails.",
        tags: ["Prompt design", "Evals", "Datasets"],
        icon: TestTube2,
        stage: "Learning",
      },
      {
        id: "automation",
        title: "Workflow automation",
        copy: "Connecting forms, APIs and spreadsheets into a pipeline that runs without anyone watching it.",
        tags: ["n8n", "Webhooks", "Queues"],
        icon: Workflow,
        stage: "Building",
      },
      {
        id: "ai-safety",
        title: "Responsible AI",
        copy: "Privacy-aware defaults, honest labelling of generated output, and keeping a person in the loop.",
        tags: ["Guardrails", "Privacy", "Disclosure"],
        icon: ShieldCheck,
        stage: "Learning",
      },
    ],
  },
  {
    id: "craft",
    title: "Product & craft",
    blurb: "Deciding what to build, and being able to explain it clearly to the person who has to use it.",
    skills: [
      {
        id: "product",
        title: "Product thinking",
        copy: "Working out the actual problem before opening an editor, then cutting everything that does not serve it.",
        tags: ["Scoping", "Prioritising", "Trade-offs"],
        icon: Lightbulb,
        stage: "Learning",
      },
      {
        id: "design-systems",
        title: "UI & design systems",
        copy: "Tokens, spacing scales and components that keep a page coherent after the twentieth small change.",
        tags: ["Tokens", "Figma", "Components"],
        icon: PenTool,
        stage: "Building",
      },
      {
        id: "performance",
        title: "Performance engineering",
        copy: "Bundle splitting, lazy routes, and measuring the actual time to useful content instead of guessing.",
        tags: ["Caching", "Lazy loading", "Profiling"],
        icon: Gauge,
        stage: "Shipping",
      },
      {
        id: "writing",
        title: "Technical writing",
        copy: "README files, setup guides and comments that let someone else run the project without calling me.",
        tags: ["Docs", "Setup guides", "Comments"],
        icon: FileText,
        stage: "Shipping",
      },
    ],
  },
];

export const SKILL_STAGE_STYLES: Record<Skill["stage"], string> = {
  Learning: "bg-[#f8ffff] text-[#71809f] border-[#d7e8eb]",
  Building: "bg-[#d9f8f6] text-[#0b7c77] border-transparent",
  Shipping: "bg-[#c7f76d] text-[#172039] border-transparent",
};

/* -------------------------------------------------------------------------- */
/* Portfolio: real, shipped projects                                          */
/* -------------------------------------------------------------------------- */

export type ProjectKind = "PLATFORM" | "AI" | "WEB" | "APP";

export type Project = {
  id: string;
  kind: ProjectKind;
  title: string;
  copy: string;
  stack: string[];
  /** One honest line about what the project is, not a fabricated metric. */
  outcome: string;
  /** Live address - every project listed here is reachable. */
  url: string;
  /** Screenshot in /public/projects, used as the card cover. */
  cover: string;
};

export const PORTFOLIO_FILTERS: { id: ProjectKind | "ALL"; label: string }[] = [
  { id: "ALL", label: "All work" },
  { id: "PLATFORM", label: "Platforms" },
  { id: "AI", label: "AI" },
  { id: "WEB", label: "Websites" },
  { id: "APP", label: "Apps" },
];

export const PROJECTS: Project[] = [
  {
    id: "coremmc",
    kind: "PLATFORM",
    title: "CoreMMC",
    copy: "A hosting platform covering Minecraft servers, VPS, domain registration, web hosting and Discord bots on India-based infrastructure.",
    stack: ["Hosting", "VPS", "Domains", "Discord bots"],
    outcome: "One dashboard for every product line, with live server status.",
    url: "https://coremmc.cloud",
    cover: "/projects/coremmc.jpg",
  },
  {
    id: "devmarket",
    kind: "PLATFORM",
    title: "DevMarket",
    copy: "A marketplace for production-ready source code, AI prompt systems and complete digital projects, with checkout and protected downloads.",
    stack: ["React", "tRPC", "PostgreSQL", "Razorpay"],
    outcome: "From an empty repository to a marketplace taking real orders.",
    url: "https://devmarket-azure.vercel.app",
    cover: "/projects/devmarket.jpg",
  },
  {
    id: "coremmc-ai",
    kind: "AI",
    title: "CoreMMC AI",
    copy: "A clean, accessible AI surface built to be useful rather than impressive, with plain language instead of jargon.",
    stack: ["React", "LLM APIs", "Accessibility"],
    outcome: "An AI experience that explains itself instead of hiding behind prompts.",
    url: "https://ai.coremmc.cloud",
    cover: "/projects/coremmc-ai.jpg",
  },
  {
    id: "flowpilot",
    kind: "AI",
    title: "FlowPilot",
    copy: "An AI copilot for drafting, brainstorming and analysis, built for a web-app hackathon. Handles files and images.",
    stack: ["React", "Hackathon", "File handling"],
    outcome: "Shipped to a public URL with no API key needed to try it.",
    url: "https://webapp-hackathon.vercel.app",
    cover: "/projects/webapp-hackathon.jpg",
  },
  {
    id: "ashish-manocha",
    kind: "WEB",
    title: "Ashish Manocha Studio",
    copy: "A portfolio site for a creative digital studio: bold work presented without the page becoming slow or loud.",
    stack: ["React", "Animation", "Responsive"],
    outcome: "A studio site that still reads well on a phone.",
    url: "https://ashish-manocha.vercel.app",
    cover: "/projects/ashish-manocha.jpg",
  },
  {
    id: "shah-hospitals",
    kind: "WEB",
    title: "Shah Hospitals",
    copy: "A site for a hospital with more than forty years of practice, covering departments and appointment booking.",
    stack: ["React", "Booking flow", "SEO"],
    outcome: "Department pages and a booking path that works on mobile.",
    url: "https://shah-hospitals.vercel.app",
    cover: "/projects/shah-hospitals.jpg",
  },
  {
    id: "saraswati-eyecare",
    kind: "WEB",
    title: "Saraswati Eye Care",
    copy: "A site for an NABH-accredited eye hospital in Jind, covering specialists, technology and cashless treatment.",
    stack: ["React", "Medical content", "Call to action"],
    outcome: "Accreditation and treatment information surfaced above the fold.",
    url: "https://saraswati-eyecare.vercel.app",
    cover: "/projects/saraswati-eyecare.jpg",
  },
  {
    id: "kamal-healthcare",
    kind: "WEB",
    title: "Kamal Healthcare",
    copy: "A nursing home and critical care site: contact details, directions, facility hours and appointment requests.",
    stack: ["React", "Local search", "Forms"],
    outcome: "The details a patient actually needs, correct and findable.",
    url: "https://kamal-healthcare.vercel.app",
    cover: "/projects/kamal-healthcare.jpg",
  },
  {
    id: "pizza-star-web",
    kind: "APP",
    title: "Pizza Star",
    copy: "The web home for a wood-fired Indian fusion pizza brand: recipes, a blog and the path to the mobile app.",
    stack: ["React", "Blog", "App install"],
    outcome: "Content and app download on one site, built for search traffic.",
    url: "https://pizzastarweb.netlify.app",
    cover: "/projects/pizzastarweb.jpg",
  },
  {
    id: "star-pizza-app",
    kind: "APP",
    title: "Star Pizza App",
    copy: "A mobile-first ordering experience for fresh pizza, focused on getting from open to placed order in a few taps.",
    stack: ["React", "Ordering flow", "Mobile first"],
    outcome: "An ordering flow a customer can finish one-handed.",
    url: "https://pizzastarapp.netlify.app",
    cover: "/projects/pizzastarapp.jpg",
  },
];

/** Pure filter so the view and the tests agree on the rule. */
export function filterProjects(projects: Project[], kind: ProjectKind | "ALL"): Project[] {
  return kind === "ALL" ? projects : projects.filter(project => project.kind === kind);
}

/* -------------------------------------------------------------------------- */
/* Learning path                                                              */
/* -------------------------------------------------------------------------- */

/**
 * TODO: replace with your real milestones and years. The `when` labels are
 * intentionally relative rather than dated so nothing is asserted that has not
 * happened yet.
 */
export const JOURNEY: { id: string; when: string; title: string; copy: string }[] = [
  {
    id: "start",
    when: "Started",
    title: "First lines of code",
    copy: "Learning the basics by building small things that did not work, and fixing them until they did.",
  },
  {
    id: "web",
    when: "Then",
    title: "The web clicked",
    copy: "HTML, CSS and JavaScript stopped being trivia and started being tools. Interfaces became the thing I wanted to build.",
  },
  {
    id: "react",
    when: "Next",
    title: "Shipping real products",
    copy: "React, TypeScript and a database — and the realisation that auth, payments and deployment are the actual hard parts.",
  },
  {
    id: "ai",
    when: "Now",
    title: "AI, carefully",
    copy: "Using models to move faster while keeping outputs honest, privacy-aware and reviewable by a person.",
  },
  {
    id: "next",
    when: "Next",
    title: "Deeper systems",
    copy: "Distributed thinking, evaluation, and the unglamorous work of making software that other people can maintain.",
  },
];

/* -------------------------------------------------------------------------- */
/* Services                                                                    */
/* -------------------------------------------------------------------------- */

export const SERVICES: { id: string; title: string; copy: string; points: string[]; icon: LucideIcon }[] = [
  {
    id: "web",
    title: "Web builds",
    copy: "A working site or web app, taken from an empty folder to something you can open on a phone.",
    points: ["Landing pages and dashboards", "Responsive from the first commit", "Setup instructions included"],
    icon: Layers,
  },
  {
    id: "automation",
    title: "Automation",
    copy: "A repetitive manual step turned into a pipeline that runs on its own and tells you when it fails.",
    points: ["Form and sheet automation", "API and webhook glue", "Failure alerts, not silent breakage"],
    icon: Workflow,
  },
  {
    id: "ai",
    title: "AI features",
    copy: "A model feature with a defined job, a fallback when it is wrong, and an interface that does not pretend otherwise.",
    points: ["Prompt and output design", "Retrieval over your own data", "Clear labelling for users"],
    icon: Bot,
  },
  {
    id: "review",
    title: "Code review",
    copy: "A second pair of eyes on a codebase, explained in plain language rather than a wall of lint output.",
    points: ["Correctness and edge cases", "Performance and bundle size", "Plain-language explanation"],
    icon: TestTube2,
  },
  {
    id: "hosting",
    title: "Hosting & infrastructure",
    copy: "Servers, domains and deployment configured so the site stays reachable and someone can restart it.",
    points: ["VPS and server setup", "DNS, domains and SSL", "Deploy and rollback pipeline"],
    icon: Server,
  },
  {
    id: "apis",
    title: "APIs & backends",
    copy: "A typed, validated backend with real endpoints that fail loudly instead of quietly returning nothing.",
    points: ["REST or tRPC endpoints", "Input validation at the boundary", "Auth and role checks"],
    icon: TerminalSquare,
  },
  {
    id: "databases",
    title: "Databases & schema",
    copy: "Schema design and migrations that can be re-run safely, and queries that survive real row counts.",
    points: ["Schema and relationship design", "Idempotent migrations", "Query and index fixes"],
    icon: Database,
  },
  {
    id: "landing",
    title: "Landing pages",
    copy: "A page that says what the thing is, loads fast, and works on the phone most visitors actually use.",
    points: ["Copy and structure", "Fast first load", "Conversion-focused calls to action"],
    icon: Rocket,
  },
  {
    id: "healthcare",
    title: "Healthcare websites",
    copy: "Sites for clinics and hospitals: departments, doctors, timings and appointments, correct and easy to find.",
    points: ["Departments and doctor profiles", "Appointment and enquiry forms", "Accreditation and facilities"],
    icon: HeartPulse,
  },
  {
    id: "ecommerce",
    title: "Ordering & checkout",
    copy: "A cart and checkout someone can finish on a phone, including the payment options that actually work locally.",
    points: ["Cart and checkout flow", "Card gateway and manual QR", "Order status for the customer"],
    icon: ShoppingBag,
  },
  {
    id: "design-systems",
    title: "UI & design systems",
    copy: "Tokens, spacing scales and components that keep a page coherent after the twentieth small change.",
    points: ["Colour and type tokens", "Reusable component set", "Figma-to-code handoff"],
    icon: PencilRuler,
  },
  {
    id: "performance",
    title: "Performance work",
    copy: "Measuring where the time actually goes, then cutting the bundle, the requests and the render work.",
    points: ["Bundle splitting and lazy routes", "Image and font budgets", "Measured before and after"],
    icon: Gauge,
  },
  {
    id: "accessibility",
    title: "Accessibility audits",
    copy: "Keyboard paths, contrast and semantics checked properly, with a plain list of what to fix and why.",
    points: ["Keyboard and focus audit", "Contrast in both themes", "Fixes applied, not just listed"],
    icon: Accessibility,
  },
  {
    id: "docs",
    title: "Docs & handover",
    copy: "The README, setup steps and environment list that let someone else run the project without calling me.",
    points: ["README and setup guide", "Environment variable list", "Architecture notes"],
    icon: FileText,
  },
];

/* -------------------------------------------------------------------------- */
/* Now building                                                                */
/* -------------------------------------------------------------------------- */

export const NOW_BUILDING: { id: string; title: string; copy: string; status: string }[] = [
  {
    id: "seller-tools",
    title: "Better seller tooling",
    copy: "Improving how listings are created and updated so the second version of a product is easier than the first.",
    status: "In progress",
  },
  {
    id: "eval-harness",
    title: "Evaluation habits",
    copy: "Getting into the habit of testing a prompt against fixed cases before believing it improved.",
    status: "Learning",
  },
  {
    id: "responsive-pass",
    title: "A responsive pass",
    copy: "Going back through older projects and fixing the layouts that only ever looked right on my own screen.",
    status: "In progress",
  },
];

/* -------------------------------------------------------------------------- */
/* AI approach                                                                 */
/* -------------------------------------------------------------------------- */

export const AI_APPROACH = {
  heading: ["Fast tools.", "Human judgment."],
  paragraphs: [
    "AI can help me move from a question to a prototype quickly. It can help with research, structure, debugging, design directions, and repetitive work.",
    "But the goal is legitimate value for users. I care about clear outcomes, truthful communication, privacy-aware decisions, accessible interfaces, and keeping people in control of the final result.",
  ],
  tags: ["Transparent", "Useful", "User-first"],
} as const;

/* -------------------------------------------------------------------------- */
/* Principles                                                                  */
/* -------------------------------------------------------------------------- */

export const PRINCIPLES: { id: string; number: string; title: string; copy: string }[] = [
  {
    id: "useful",
    number: "01",
    title: "Useful over flashy",
    copy: "Technology should reduce friction and help a real person complete something meaningful.",
  },
  {
    id: "legitimate",
    number: "02",
    title: "AI with legitimacy",
    copy: "AI-generated experiences should be transparent, safe, and designed around the user — not hidden behind hype.",
  },
  {
    id: "ship",
    number: "03",
    title: "Learn by shipping",
    copy: "Small experiments, working prototypes, and honest iteration create deeper understanding than theory alone.",
  },
  {
    id: "control",
    number: "04",
    title: "Keep the human in control",
    copy: "Automation is most valuable when people can inspect it, guide it, and make the final decision.",
  },
  {
    id: "measure",
    number: "05",
    title: "Measure before claiming",
    copy: "If I cannot measure it, I describe it as an intention rather than a result.",
  },
  {
    id: "accessible",
    number: "06",
    title: "Accessible by default",
    copy: "Keyboard paths, readable contrast, and honest alt text are part of the work, not a final pass.",
  },
];

/* -------------------------------------------------------------------------- */
/* FAQ                                                                         */
/* -------------------------------------------------------------------------- */

export const FAQ_ITEMS: { id: string; question: string; answer: string }[] = [
  {
    id: "what-can-you-build",
    question: "What can you actually build?",
    answer:
      "Mostly web: a landing page, a small dashboard, a full-stack app with auth and payments, or an automation that removes a manual step. I take on work where I can finish it properly rather than many things halfway.",
  },
  {
    id: "tools",
    question: "What do you work in?",
    answer:
      "React and TypeScript on the front, Node and PostgreSQL on the back, Git for version control, and Figma when the interface needs deciding before code. For AI work I stay close to the provider APIs rather than hiding behind a framework.",
  },
  {
    id: "ai-usage",
    question: "How do you use AI while building?",
    answer:
      "For research, first drafts, debugging and repetitive structure — the parts where being wrong is cheap to check. The decisions and the final code are mine, and anything generated is reviewed before it ships.",
  },
  {
    id: "working-together",
    question: "How would working together look?",
    answer:
      "A short call to agree on the smallest useful version, a build with a demo you can click at every step, and a short handover with setup instructions. No long contracts and no scope invented halfway through.",
  },
  {
    id: "learning",
    question: "I am still studying — is that a problem?",
    answer:
      "It means you are paying attention rather than coasting. I would rather work with someone who is honest about what they do not know yet and learns quickly than someone who hides it.",
  },
];

/* -------------------------------------------------------------------------- */
/* Contact                                                                     */
/* -------------------------------------------------------------------------- */

export const CONTACT = {
  heading: "Automation systems, AI-native products, and better ways to learn by building.",
  copy: "If any of that sounds like the problem you are trying to solve, I would be glad to hear about it.",
  cta: { label: "Start a conversation", href: "mailto:nitin.sharma@example.com" },
  /** Secondary notes, shown as plain text so nothing pretends to be a live profile. */
  notes: ["Open to internships, freelance builds and collaborations", "Based in Kaithal, Haryana — working remotely"],
} as const;