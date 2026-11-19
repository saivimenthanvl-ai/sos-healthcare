import type { SupportedLanguage } from "@/lib/i18n";
import type { LegalPageContent } from "./legal-types";

// Import all 25 legal content JSON files statically
import en from "./legal/en.json";
import es from "./legal/es.json";
import fr from "./legal/fr.json";
import ta from "./legal/ta.json";
import hi from "./legal/hi.json";
import ar from "./legal/ar.json";
import pl from "./legal/pl.json";
import ru from "./legal/ru.json";
import te from "./legal/te.json";
import ml from "./legal/ml.json";
import pa from "./legal/pa.json";
import bn from "./legal/bn.json";
import kn from "./legal/kn.json";
import sr from "./legal/sr.json";
import hr from "./legal/hr.json";
import nl from "./legal/nl.json";
import as from "./legal/as.json";
import pt from "./legal/pt.json";
import fa from "./legal/fa.json";
import zhHans from "./legal/zh-Hans.json";
import ja from "./legal/ja.json";
import ko from "./legal/ko.json";
import it from "./legal/it.json";
import mr from "./legal/mr.json";
import zhHant from "./legal/zh-Hant.json";

export interface LegalBundle {
  privacy: LegalPageContent;
  terms: LegalPageContent;
}

const bundles: Record<SupportedLanguage, LegalBundle> = {
  en: en as unknown as LegalBundle,
  es: es as unknown as LegalBundle,
  fr: fr as unknown as LegalBundle,
  ta: ta as unknown as LegalBundle,
  hi: hi as unknown as LegalBundle,
  ar: ar as unknown as LegalBundle,
  pl: pl as unknown as LegalBundle,
  ru: ru as unknown as LegalBundle,
  te: te as unknown as LegalBundle,
  ml: ml as unknown as LegalBundle,
  pa: pa as unknown as LegalBundle,
  bn: bn as unknown as LegalBundle,
  kn: kn as unknown as LegalBundle,
  sr: sr as unknown as LegalBundle,
  hr: hr as unknown as LegalBundle,
  nl: nl as unknown as LegalBundle,
  as: as as unknown as LegalBundle,
  pt: pt as unknown as LegalBundle,
  fa: fa as unknown as LegalBundle,
  "zh-Hans": zhHans as unknown as LegalBundle,
  ja: ja as unknown as LegalBundle,
  ko: ko as unknown as LegalBundle,
  it: it as unknown as LegalBundle,
  mr: mr as unknown as LegalBundle,
  "zh-Hant": zhHant as unknown as LegalBundle,
};

export function getLegalContent(language: SupportedLanguage): LegalBundle {
  return bundles[language] || bundles.en;
}
