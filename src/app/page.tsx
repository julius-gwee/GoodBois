import { KawanDirectoryApp } from "@/components/map/KawanDirectoryApp";
import type { DirectoryLanguage } from "@/types/goodbois";

const supportedLanguages: DirectoryLanguage[] = ["en", "zh-Hans", "nan-Hant", "ms", "ta"];

type HomeProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = (await searchParams) ?? {};
  const languageParam = Array.isArray(params.language) ? params.language[0] : params.language;
  const fromParam = Array.isArray(params.from) ? params.from[0] : params.from;
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
  const initialLanguage = supportedLanguages.includes(languageParam as DirectoryLanguage)
    ? (languageParam as DirectoryLanguage)
    : "en";

  return (
    <KawanDirectoryApp
      initialLanguage={initialLanguage}
      initialFromChat={Boolean(sessionId) || fromParam === "chat"}
    />
  );
}
