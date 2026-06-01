export type Credibility =
  | "confirmed"
  | "partial"
  | "unverified"
  | "speculative"
  | "narrative";

export interface Theory {
  slug: string;
  title: string;
  codename: string;
  summary: string;
  category: string;
  tags: string[];
  credibility: Credibility;
  documents: number;
  entities: string[];
  year: string;
  classification: "TOP SECRET" | "CONFIDENTIAL" | "DECLASSIFIED" | "RESTRICTED";
}

export const CREDIBILITY_LABEL: Record<Credibility, string> = {
  confirmed: "Confirmado",
  partial: "Parcialmente Documentado",
  unverified: "Não Comprovado",
  speculative: "Especulativo",
  narrative: "Narrativa Investigativa",
};

export const theories: Theory[] = [
  {
    slug: "mkultra",
    title: "Projeto MKUltra",
    codename: "MK-ULTRA / ARTICHOKE",
    summary:
      "Programa de controle mental conduzido pela CIA entre 1953 e 1973, envolvendo experimentação com LSD, hipnose e privação sensorial em sujeitos sem consentimento.",
    category: "Operações Psicológicas",
    tags: ["CIA", "Guerra Fria", "Experimentação", "Documentos Liberados"],
    credibility: "confirmed",
    documents: 47,
    entities: ["CIA", "Sidney Gottlieb", "Frank Olson", "Allen Dulles"],
    year: "1953–1973",
    classification: "DECLASSIFIED",
  },
  {
    slug: "jfk-assassination",
    title: "Assassinato de JFK",
    codename: "DALLAS / NOV 22",
    summary:
      "Análise documental dos arquivos JFK liberados, incluindo correspondência da CIA, FBI e Comissão Warren. Conexões com operações cubanas e o exílio anti-Castro.",
    category: "Política",
    tags: ["JFK", "CIA", "FBI", "Cuba", "1963"],
    credibility: "partial",
    documents: 312,
    entities: ["John F. Kennedy", "Lee Harvey Oswald", "CIA", "Jack Ruby"],
    year: "1963",
    classification: "DECLASSIFIED",
  },
  {
    slug: "unit-731",
    title: "Unidade 731",
    codename: "MANCHURIA UNIT 731",
    summary:
      "Unidade de pesquisa biológica e química do Exército Imperial Japonês na Manchúria. Experimentos humanos documentados durante a Segunda Guerra Sino-Japonesa.",
    category: "Projetos Militares",
    tags: ["Japão", "II Guerra", "Bioarmas", "Manchúria"],
    credibility: "confirmed",
    documents: 88,
    entities: ["Shiro Ishii", "Exército Imperial", "Pingfang"],
    year: "1935–1945",
    classification: "DECLASSIFIED",
  },
  {
    slug: "operation-paperclip",
    title: "Operação Paperclip",
    codename: "PAPERCLIP",
    summary:
      "Recrutamento secreto de mais de 1.600 cientistas alemães pela inteligência militar dos EUA ao fim da Segunda Guerra Mundial.",
    category: "Guerra Fria",
    tags: ["OSS", "Alemanha", "NASA", "Wernher von Braun"],
    credibility: "confirmed",
    documents: 134,
    entities: ["Wernher von Braun", "OSS", "JIOA"],
    year: "1945–1959",
    classification: "DECLASSIFIED",
  },
  {
    slug: "bohemian-grove",
    title: "Bohemian Grove",
    codename: "GROVE / OWL",
    summary:
      "Encontro anual privado em Monte Rio, Califórnia, reunindo figuras políticas, militares e corporativas de alto escalão desde 1872.",
    category: "Sociedades Secretas",
    tags: ["Elite", "Califórnia", "Bohemian Club"],
    credibility: "partial",
    documents: 23,
    entities: ["Bohemian Club", "Richard Nixon", "Henry Kissinger"],
    year: "1872–presente",
    classification: "RESTRICTED",
  },
  {
    slug: "cointelpro",
    title: "COINTELPRO",
    codename: "COUNTER INTELLIGENCE PROGRAM",
    summary:
      "Série de projetos clandestinos do FBI conduzidos entre 1956 e 1971, focados na vigilância, infiltração e desestabilização de organizações políticas domésticas.",
    category: "Vigilância Governamental",
    tags: ["FBI", "Hoover", "Vigilância", "Anos 60"],
    credibility: "confirmed",
    documents: 201,
    entities: ["J. Edgar Hoover", "FBI", "Martin Luther King Jr."],
    year: "1956–1971",
    classification: "DECLASSIFIED",
  },
  {
    slug: "bermuda-triangle",
    title: "Triângulo das Bermudas",
    codename: "DEVIL'S TRIANGLE",
    summary:
      "Região do Atlântico Norte associada a desaparecimentos de embarcações e aeronaves. Análise documental de relatórios da Marinha e Guarda Costeira.",
    category: "Geografia / Anomalias",
    tags: ["Atlântico", "Marinha", "Aviação"],
    credibility: "speculative",
    documents: 19,
    entities: ["US Navy", "Flight 19", "USS Cyclops"],
    year: "1945–presente",
    classification: "DECLASSIFIED",
  },
  {
    slug: "iran-contra",
    title: "Caso Irã-Contras",
    codename: "IRAN-CONTRA AFFAIR",
    summary:
      "Esquema secreto envolvendo a venda de armas ao Irã para financiar os Contras na Nicarágua, durante o governo Reagan.",
    category: "Geopolítica",
    tags: ["Reagan", "Irã", "Nicarágua", "CIA"],
    credibility: "confirmed",
    documents: 156,
    entities: ["Oliver North", "Reagan", "CIA", "Contras"],
    year: "1985–1987",
    classification: "DECLASSIFIED",
  },
  {
    slug: "masonic-order",
    title: "Maçonaria — Estrutura Internacional",
    codename: "GRAND ORIENT",
    summary:
      "Catalogação histórica de lojas maçônicas, ritos e figuras políticas associadas, com foco em documentos públicos e correspondência arquivada.",
    category: "Sociedades Secretas",
    tags: ["Maçonaria", "Grande Oriente", "História"],
    credibility: "narrative",
    documents: 67,
    entities: ["Grande Oriente", "Scottish Rite", "P2 Lodge"],
    year: "1717–presente",
    classification: "RESTRICTED",
  },
];

export interface Source {
  id: string;
  title: string;
  author: string;
  type: "PDF" | "EPUB" | "Transcrição" | "Relatório" | "Documento Liberado";
  origin: string;
  year: string;
  reliability: number;
  tags: string[];
}

export const sources: Source[] = [
  {
    id: "src-001",
    title: "MKUltra — CIA Family Jewels Report",
    author: "Central Intelligence Agency",
    type: "Documento Liberado",
    origin: "FOIA Request #1977-04",
    year: "1977",
    reliability: 95,
    tags: ["MKUltra", "CIA", "FOIA"],
  },
  {
    id: "src-002",
    title: "The Warren Commission Report",
    author: "U.S. President's Commission",
    type: "Relatório",
    origin: "U.S. Government Printing Office",
    year: "1964",
    reliability: 82,
    tags: ["JFK", "Comissão Warren"],
  },
  {
    id: "src-003",
    title: "Unit 731 — Japanese Army Records",
    author: "Imperial Japanese Army",
    type: "PDF",
    origin: "Archives of Japan / Translated",
    year: "1945",
    reliability: 88,
    tags: ["Unidade 731", "II Guerra"],
  },
  {
    id: "src-004",
    title: "Operation Paperclip Casebook",
    author: "Annie Jacobsen",
    type: "EPUB",
    origin: "Little, Brown and Company",
    year: "2014",
    reliability: 78,
    tags: ["Paperclip", "Nazistas", "NASA"],
  },
  {
    id: "src-005",
    title: "COINTELPRO Files — FBI Vault",
    author: "Federal Bureau of Investigation",
    type: "Documento Liberado",
    origin: "FBI Records Vault",
    year: "1971",
    reliability: 96,
    tags: ["FBI", "COINTELPRO"],
  },
  {
    id: "src-006",
    title: "Iran-Contra: Tower Commission Report",
    author: "Tower Commission",
    type: "Relatório",
    origin: "U.S. Senate",
    year: "1987",
    reliability: 90,
    tags: ["Irã", "Reagan"],
  },
];

export interface PasteEntry {
  id: string;
  title: string;
  author: string;
  date: string;
  excerpt: string;
  tags: string[];
}

export const pastes: PasteEntry[] = [
  {
    id: "vault-001",
    title: "Análise: rede de financiamento Irã-Contras",
    author: "anon_researcher_07",
    date: "2025-11-14",
    excerpt:
      "Mapeamento das contas suíças identificadas no inquérito Tower. Conexões com a Banque al-Mashrek e operadores intermediários no Líbano...",
    tags: ["Irã-Contras", "Finanças"],
  },
  {
    id: "vault-002",
    title: "Cross-reference: MKUltra e Operation Midnight Climax",
    author: "shadowdesk",
    date: "2025-10-30",
    excerpt:
      "Subprojetos 3, 16 e 42 da MKUltra apresentam sobreposição de pessoal com a operação Midnight Climax em São Francisco. Análise dos memos liberados em 1977...",
    tags: ["MKUltra", "CIA", "Subprojetos"],
  },
  {
    id: "vault-003",
    title: "Timeline: Bohemian Grove 1971–1989",
    author: "the_archivist",
    date: "2025-11-02",
    excerpt:
      "Reconstrução da lista de convidados confirmados via correspondência arquivada da Hoover Institution. Cruzamento com agendas presidenciais...",
    tags: ["Bohemian Grove", "Elite"],
  },
];

export interface FeedItem {
  id: string;
  type: "ingestion" | "update" | "investigation" | "alert";
  message: string;
  timestamp: string;
  ref?: string;
}

export const feed: FeedItem[] = [
  {
    id: "f1",
    type: "ingestion",
    message: "47 novos chunks indexados a partir do dossiê MKUltra (FOIA 1977-04).",
    timestamp: "há 12 min",
    ref: "mkultra",
  },
  {
    id: "f2",
    type: "investigation",
    message:
      "Nova relação detectada entre Operação Paperclip e financiamento da NASA pós-1958.",
    timestamp: "há 1 h",
    ref: "operation-paperclip",
  },
  {
    id: "f3",
    type: "alert",
    message: "Tentativa de upload bloqueada por filtro de moderação: tema proibido.",
    timestamp: "há 3 h",
  },
  {
    id: "f4",
    type: "update",
    message: "Credibilidade de COINTELPRO atualizada para CONFIRMADO (+12 fontes).",
    timestamp: "ontem",
    ref: "cointelpro",
  },
  {
    id: "f5",
    type: "ingestion",
    message: "Transcrição de 312 páginas do dossiê JFK adicionada ao índice vetorial.",
    timestamp: "ontem",
    ref: "jfk-assassination",
  },
];