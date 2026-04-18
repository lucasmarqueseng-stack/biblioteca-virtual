import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const books = [
  {
    title: "Dom Casmurro",
    authors: ["Machado de Assis"],
    year: 1899,
    genre: "Romance",
    description:
      "O narrador Bento Santiago reconstrói sua juventude em meio à dúvida sobre a suposta traição de Capitu.",
    coverUrl:
      "https://m.media-amazon.com/images/I/71pI5PHAAqL._AC_UF1000,1000_QL80_.jpg",
    status: "LIDO",
    owned: true,
    initialRating: 5,
    pages: 256,
    pagesRead: 256,
  },
  {
    title: "A Hora da Estrela",
    authors: ["Clarice Lispector"],
    year: 1977,
    genre: "Romance",
    description:
      "Narrativa sobre a nordestina Macabéa, vivendo no Rio de Janeiro e enfrentando uma existência dura e solitária.",
    coverUrl:
      "https://m.media-amazon.com/images/I/61V6jGJe1sL._AC_UF1000,1000_QL80_.jpg",
    status: "LENDO",
    owned: true,
    initialRating: 4,
    pages: 96,
    pagesRead: 40,
  },
  {
    title: "O Cortiço",
    authors: ["Aluísio Azevedo"],
    year: 1890,
    genre: "Romance",
    description:
      "Retrato naturalista da vida em um cortiço do Rio de Janeiro no fim do século XIX.",
    coverUrl:
      "https://m.media-amazon.com/images/I/81Wf2gqWPwL._AC_UF1000,1000_QL80_.jpg",
    status: "NAO_LIDO",
    owned: false,
    initialRating: null,
    pages: 304,
    pagesRead: 0,
  },
  {
    title: "Sapiens",
    authors: ["Yuval Noah Harari"],
    year: 2011,
    genre: "Não-ficção",
    description:
      "Breve história da humanidade, do surgimento do Homo sapiens até a era da tecnologia.",
    coverUrl:
      "https://m.media-amazon.com/images/I/71-ghLb8qML._AC_UF1000,1000_QL80_.jpg",
    status: "LIDO",
    owned: true,
    initialRating: 5,
    pages: 464,
    pagesRead: 464,
  },
  {
    title: "O Senhor dos Anéis: A Sociedade do Anel",
    authors: ["J.R.R. Tolkien"],
    year: 1954,
    genre: "Fantasia",
    description:
      "Frodo parte da Condado para destruir o Um Anel ao lado de uma sociedade improvável de aliados.",
    coverUrl:
      "https://m.media-amazon.com/images/I/71jLBXtWJWL._AC_UF1000,1000_QL80_.jpg",
    status: "LENDO",
    owned: true,
    initialRating: 5,
    pages: 576,
    pagesRead: 240,
  },
  {
    title: "1984",
    authors: ["George Orwell"],
    year: 1949,
    genre: "Ficção científica",
    description:
      "Distopia clássica sobre vigilância totalitária no Estado oceânico liderado pelo Grande Irmão.",
    coverUrl:
      "https://m.media-amazon.com/images/I/61ZewDE3beL._AC_UF1000,1000_QL80_.jpg",
    status: "NAO_LIDO",
    owned: true,
    initialRating: 5,
    pages: 416,
    pagesRead: 0,
  },
  {
    title: "A Revolução dos Bichos",
    authors: ["George Orwell"],
    year: 1945,
    genre: "Ficção",
    description:
      "Fábula política que satiriza os rumos da Revolução Russa através de uma comunidade de animais.",
    coverUrl:
      "https://m.media-amazon.com/images/I/61KoOv1Q3IL._AC_UF1000,1000_QL80_.jpg",
    status: "LIDO",
    owned: true,
    initialRating: 4,
    pages: 152,
    pagesRead: 152,
  },
];

async function main() {
  console.log("🌱 Iniciando seed...");

  // Limpa dados (seed idempotente)
  await prisma.review.deleteMany();
  await prisma.readingGoal.deleteMany();
  await prisma.book.deleteMany();
  await prisma.author.deleteMany();

  for (const b of books) {
    const createdAuthors = await Promise.all(
      b.authors.map((name) =>
        prisma.author.upsert({
          where: { name },
          create: { name },
          update: {},
        }),
      ),
    );

    const book = await prisma.book.create({
      data: {
        title: b.title,
        year: b.year,
        genre: b.genre,
        description: b.description,
        coverUrl: b.coverUrl,
        status: b.status,
        owned: b.owned,
        initialRating: b.initialRating,
        pages: b.pages,
        pagesRead: b.pagesRead,
        finishedAt: b.status === "LIDO" ? new Date() : null,
        authors: { connect: createdAuthors.map((a) => ({ id: a.id })) },
      },
    });

    // Adiciona uma avaliação para livros lidos
    if (b.status === "LIDO" && b.initialRating) {
      await prisma.review.create({
        data: {
          bookId: book.id,
          rating: b.initialRating,
          comment: "Leitura marcante!",
        },
      });
    }
  }

  // Meta do ano atual
  const currentYear = new Date().getFullYear();
  const goal = await prisma.readingGoal.create({
    data: {
      year: currentYear,
      targetBooks: 12,
      targetPages: 4000,
    },
  });

  // Associa todos os livros à meta
  const allBooks = await prisma.book.findMany();
  await prisma.readingGoal.update({
    where: { id: goal.id },
    data: { books: { connect: allBooks.map((b) => ({ id: b.id })) } },
  });

  console.log(`✅ Seed concluído: ${allBooks.length} livros, 1 meta (${currentYear}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
