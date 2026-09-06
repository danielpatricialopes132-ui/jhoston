export interface CompanyBranding {
  code: string;
  name: string;
  subtitle: string;
  corporateName: string;
  cnpj: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
}

export const COMPANIES_BRANDING: Record<string, CompanyBranding> = {
  ECO_STONE: {
    code: "ECO_STONE",
    name: "ECO STONE",
    subtitle: "Cascatas & Pedras Naturais",
    corporateName: "ECO STONE",
    cnpj: "63.013.022/0001-06",
    logo: "/eco_stone.jpeg",
    primaryColor: "#16a34a",
    secondaryColor: "#3cb371",
  },
  JHOSTON_REVEST: {
    code: "JHOSTON_REVEST",
    name: "JHOSTON REVEST",
    subtitle: "Construções & Revestimentos Resinados",
    corporateName: "JHOSTON REVEST",
    cnpj: "63.013.022/0001-06",
    logo: "/revest.png",
    primaryColor: "#d97706",
    secondaryColor: "#f59e0b",
  },
  JHOSTON: {
    code: "JHOSTON",
    name: "JHOSTON POOLS",
    subtitle: "Construção de Piscinas & Ambientes",
    corporateName: "VERANO POOLS COMERCIO LTDA",
    cnpj: "63.013.022/0001-06",
    logo: "/logo_2.png",
    primaryColor: "#0f766e",
    secondaryColor: "#0369a1",
  },
};

export function getCompanyBranding(empresaInput?: string | null): CompanyBranding {
  if (!empresaInput) return COMPANIES_BRANDING.JHOSTON;
  
  const normalized = empresaInput.toUpperCase().replace(/\s+/g, "_").trim();
  
  if (normalized.includes("ECO")) {
    return COMPANIES_BRANDING.ECO_STONE;
  }
  if (normalized.includes("REVEST")) {
    return COMPANIES_BRANDING.JHOSTON_REVEST;
  }
  return COMPANIES_BRANDING.JHOSTON;
}
