export const LANGUAGE_IDS = ["javascript", "typescript", "python", "java", "c", "cpp", "csharp", "go", "rust", "php", "kotlin"] as const;
export type LanguageId = (typeof LANGUAGE_IDS)[number];

export const LANGUAGES: Record<LanguageId, { label:string; piston:string; fileName:string; monaco:string }> = {
  javascript: { label:"JavaScript", piston:"javascript", fileName:"main.js", monaco:"javascript" },
  typescript: { label:"TypeScript", piston:"typescript", fileName:"main.ts", monaco:"typescript" },
  python: { label:"Python", piston:"python", fileName:"main.py", monaco:"python" },
  java: { label:"Java", piston:"java", fileName:"Main.java", monaco:"java" },
  c: { label:"C", piston:"c", fileName:"main.c", monaco:"c" },
  cpp: { label:"C++", piston:"c++", fileName:"main.cpp", monaco:"cpp" },
  csharp: { label:"C#", piston:"csharp", fileName:"Main.cs", monaco:"csharp" },
  go: { label:"Go", piston:"go", fileName:"main.go", monaco:"go" },
  rust: { label:"Rust", piston:"rust", fileName:"main.rs", monaco:"rust" },
  php: { label:"PHP", piston:"php", fileName:"main.php", monaco:"php" },
  kotlin: { label:"Kotlin", piston:"kotlin", fileName:"Main.kt", monaco:"kotlin" },
};
