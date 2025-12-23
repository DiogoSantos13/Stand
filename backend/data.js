const { v4: uuid } = require("uuid");

// Em memória (reinicia quando o servidor reinicia)
const users = [];

// Produtos iniciais
const products = [
  {
    id: uuid(),
    nome: "Yamaha R1",
    tipo: "mota",
    categoria: "desportiva",
    preco: 15000,
    stock: 3,
    imagemUrl: "https://picsum.photos/seed/yamaha/1200/700",
    descricao: "Mota desportiva de alta performance."
  },
  {
    id: uuid(),
    nome: "Honda CB 650 R",
    tipo: "mota",
    categoria: "desportiva",
    preco: 9000,
    stock: 5,
    imagemUrl:
      "https://motoboxe.pt/cdn/shop/files/457974_24YMHONDACB650R.jpg?v=1716400868&width=1946",

    descricao: "Equilíbrio entre cidade e pista."
  },
  {
    id: uuid(),
    nome: "BMW M3",
    tipo: "carro",
    categoria: "desportivo",
    preco: 60000,
    stock: 1,
    imagemUrl: "https://picsum.photos/seed/bmw/1200/700",
    descricao: "Carro desportivo de luxo."
  },
  {
    id: uuid(),
    nome: "Volkswagen Golf",
    tipo: "carro",
    categoria: "compacto",
    preco: 22000,
    stock: 4,
    imagemUrl: "https://picsum.photos/seed/golf/1200/700",
    descricao: "Carro compacto para o dia-a-dia."
  },
  {
    id: uuid(),
    nome: "Pneu Moto 120/70 ZR17",
    tipo: "peca",
    categoria: "pneu",
    preco: 150,
    stock: 20,
    imagemUrl: "https://picsum.photos/seed/pneu/1200/700",
    descricao: "Pneu desportivo para mota."
  },
  {
    id: uuid(),
    nome: "Pastilhas de travão Brembo",
    tipo: "peca",
    categoria: "travagem",
    preco: 80,
    stock: 30,
    imagemUrl: "https://picsum.photos/seed/pastilhas/1200/700",
    descricao: "Pastilhas de alto desempenho."
  }
];

const orders = [];
const comments = [];

module.exports = { users, products, orders, comments };
