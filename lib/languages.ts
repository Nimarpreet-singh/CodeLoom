export const LANGUAGE_IDS = ["javascript", "typescript", "python", "java", "c", "cpp", "csharp", "go", "rust", "php", "kotlin"] as const;
export type LanguageId = (typeof LANGUAGE_IDS)[number];

export const LANGUAGES: Record<LanguageId, { label:string; judge0:number; monaco:string }> = {
  javascript: { label:"JavaScript", judge0:102, monaco:"javascript" },
  typescript: { label:"TypeScript", judge0:101, monaco:"typescript" },
  python: { label:"Python", judge0:100, monaco:"python" },
  java: { label:"Java", judge0:91, monaco:"java" },
  c: { label:"C", judge0:103, monaco:"c" },
  cpp: { label:"C++", judge0:105, monaco:"cpp" },
  csharp: { label:"C#", judge0:51, monaco:"csharp" },
  go: { label:"Go", judge0:106, monaco:"go" },
  rust: { label:"Rust", judge0:108, monaco:"rust" },
  php: { label:"PHP", judge0:98, monaco:"php" },
  kotlin: { label:"Kotlin", judge0:111, monaco:"kotlin" },
};
