import { Code2 } from "lucide-react";

const techRow1 = [
  { name: "Android", src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/android/android-original.svg" },
  { name: "Kotlin", src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kotlin/kotlin-original.svg" },
  { name: "Flutter", src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/flutter/flutter-original.svg" },
  { name: "React", src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" },
  { name: "JavaScript", src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg" },
  { name: "TypeScript", src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" },
  { name: "Python", src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg" },
  { name: "Java", src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg" },
  { name: "Swift", src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/swift/swift-original.svg" },
  { name: "Dart", src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/dart/dart-original.svg" },
  { name: "Go", src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original.svg" },
  { name: "Rust", src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/rust/rust-original.svg" },
];

const techRow2 = [
  { name: "VS Code", src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vscode/vscode-original.svg" },
  { name: "Android Studio", src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/androidstudio/androidstudio-original.svg" },
  { name: "Firebase", src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/firebase/firebase-original.svg" },
  { name: "Node.js", src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg" },
  { name: "MongoDB", src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg" },
  { name: "PostgreSQL", src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg" },
  { name: "Docker", src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg" },
  { name: "Git", src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg" },
  { name: "Figma", src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg" },
  { name: "TailwindCSS", src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg" },
  { name: "Next.js", src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg" },
  { name: "HTML5", src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg" },
];

function TechIcon({ name, src }: { name: string; src: string }) {
  return (
    <div className="flex flex-col items-center justify-center flex-shrink-0 mx-3 sm:mx-4" style={{ width: 72 }}>
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-transform hover:scale-110" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <img src={src} alt={name} className="w-7 h-7 sm:w-8 sm:h-8" width="32" height="32" loading="lazy" />
      </div>
      <span className="text-[10px] mt-1.5 text-center font-medium truncate w-full" style={{ color: "var(--muted-foreground)" }}>{name}</span>
    </div>
  );
}

export default function TechnologiesSection() {
  return (
    <section className="py-10 overflow-hidden">
      <div className="text-center mb-6 px-4">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>Technologies We Teach</p>
      </div>
      <div className="space-y-5">
        <div className="overflow-hidden relative">
          <div className="tech-scroll-left" style={{ "--scroll-speed": "35s" } as React.CSSProperties}>
            {[...techRow1, ...techRow1].map((tech, i) => (
              <TechIcon key={`r1-${i}`} name={tech.name} src={tech.src} />
            ))}
          </div>
        </div>
        <div className="overflow-hidden relative">
          <div className="tech-scroll-right" style={{ "--scroll-speed": "40s" } as React.CSSProperties}>
            {[...techRow2, ...techRow2].map((tech, i) => (
              <TechIcon key={`r2-${i}`} name={tech.name} src={tech.src} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
