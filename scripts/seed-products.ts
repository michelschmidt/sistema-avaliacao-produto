/**
 * Popula a home com produtos fictícios via POST /api/v1/products.
 *
 *   bun scripts/seed-products.ts
 *   SEED_BASE_URL=https://meu-app.vercel.app bun scripts/seed-products.ts
 *
 * Requer o app rodando (`bun dev`) e a migration de products aplicada.
 */

const BASE_URL = (process.env.SEED_BASE_URL ?? "http://localhost:3000").replace(
  /\/+$/,
  "",
);

type SeedProduct = { name: string; description?: string };

const PRODUCTS: SeedProduct[] = [
  {
    name: "Garrafa térmica 750 ml",
    description:
      "Aço inox com parede dupla, mantém a bebida gelada por até 24 horas.",
  },
  {
    name: "Fone de ouvido sem fio",
    description:
      "Bluetooth 5.3, cancelamento de ruído e estojo com carga para 30 horas.",
  },
  {
    name: "Mochila urbana 20 L",
    description:
      "Compartimento acolchoado para notebook de até 15 polegadas e tecido resistente à água.",
  },
  {
    name: "Cafeteira italiana",
    description: "Alumínio, 6 xícaras, funciona em fogão a gás e elétrico.",
  },
  {
    name: "Luminária de mesa articulada",
    description: "LED com três temperaturas de cor e regulagem de intensidade.",
  },
  {
    name: "Tênis de corrida leve",
    description: "Entressola com bom amortecimento para treinos de até 10 km.",
  },
  {
    name: "Caderno pontilhado A5",
    description: "Capa dura, 160 páginas de papel 120 g/m².",
  },
  {
    name: "Panela de ferro fundido",
    description: "24 cm, pré-curada, vai do fogão ao forno.",
  },
  {
    name: "Teclado mecânico compacto",
    description: "Layout 75%, switches marrons e conexão USB-C ou Bluetooth.",
  },
  { name: "Mouse ergonômico vertical" },
  {
    name: "Carregador portátil 10.000 mAh",
    description: "Duas saídas USB e carga rápida de 20 W.",
  },
  {
    name: "Jogo de facas de cozinha",
    description: "Cinco peças em aço inox com suporte de madeira.",
  },
  {
    name: "Tapete de yoga antiderrapante",
    description: "6 mm de espessura, acompanha alça para transporte.",
  },
  {
    name: "Relógio esportivo com GPS",
    description:
      "Monitor cardíaco, contagem de passos e bateria para uma semana.",
  },
  {
    name: "Liquidificador de alta potência",
    description: "1.200 W, copo de 2 litros e função pulsar.",
  },
  { name: "Óculos de sol polarizados" },
  {
    name: "Caixa de som portátil",
    description: "À prova d'água, 12 horas de bateria e pareamento estéreo.",
  },
  {
    name: "Travesseiro de espuma viscoelástica",
    description: "Capa removível e lavável, formato anatômico.",
  },
  {
    name: "Kit de chaves de precisão",
    description: "32 pontas magnéticas para consertos de eletrônicos.",
  },
  {
    name: "Câmera instantânea",
    description: "Revela a foto em poucos minutos; usa filme mini.",
  },
  {
    name: "Escova de dentes elétrica",
    description: "Timer de dois minutos e três modos de escovação.",
  },
  {
    name: "Cadeira de escritório",
    description: "Encosto em tela, apoio lombar e braços reguláveis.",
  },
  {
    name: "Bicicleta dobrável aro 20",
    description: "Quadro de alumínio, 6 marchas e dobra em segundos.",
  },
  {
    name: "Leitor de livros digitais",
    description: "Tela de 6 polegadas sem reflexo e luz ajustável.",
  },
  {
    name: "Mala de bordo rígida",
    description: "Rodinhas 360°, cadeado TSA e cabe no compartimento do avião.",
  },
  { name: "Fritadeira sem óleo 4 L" },
  {
    name: "Conjunto de potes herméticos",
    description: "Dez potes de vidro com tampa de travas, vão ao micro-ondas.",
  },
  {
    name: "Ventilador de mesa silencioso",
    description: "Três velocidades e oscilação automática.",
  },
  {
    name: "Lanterna recarregável",
    description: "800 lúmens, carregamento USB-C e corpo de alumínio.",
  },
  {
    name: "Moedor de café manual",
    description: "Mós cerâmicas com regulagem de moagem.",
  },
];

function slug(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  console.log(`Cadastrando ${PRODUCTS.length} produtos em ${BASE_URL}…`);
  let created = 0;

  // Sequencial para que created_at siga a ordem da lista.
  for (const product of PRODUCTS) {
    const key = slug(product.name);
    const response = await fetch(`${BASE_URL}/api/v1/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: product.name,
        description: product.description,
        imageUrl: `https://picsum.photos/seed/${key}/600/450`,
        externalLink: `https://example.com/produtos/${key}`,
      }),
    });

    if (!response.ok) {
      console.error(
        `✗ ${product.name}: ${response.status} ${await response.text()}`,
      );
      continue;
    }

    created += 1;
    console.log(`✓ ${product.name}`);
  }

  console.log(`\n${created}/${PRODUCTS.length} produtos cadastrados.`);
  if (created < PRODUCTS.length) process.exit(1);
}

await main();

export {};
