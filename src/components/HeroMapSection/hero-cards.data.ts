export interface HeroCard {
  id: string;
  title: string;
  price: string;
  match: number;
  image: string;
  avatar: string;
  x: number; // percentage from left
  y: number; // percentage from top
  mx?: number; // mobile left %
  my?: number; // mobile top %
}

export const HERO_CARDS: HeroCard[] = [
  {
    id: "h1",
    title: "Cozy 1RK near Viman Nagar",
    price: "₹18,500/mo",
    match: 96,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
    x: 22,
    y: 42,
    mx: 18,
    my: 54
  },
  {
    id: "h2",
    title: "Sunny 2BHK in Koregaon Park",
    price: "₹32,000/mo",
    match: 91,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=400&q=80",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    x: 76,
    y: 38,
    mx: 50,
    my: 38
  },
  {
    id: "h3",
    title: "Shared room, Baner tech hub",
    price: "₹9,800/mo",
    match: 88,
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    x: 15,
    y: 75,
    mx: 82,
    my: 54
  },
  {
    id: "h4",
    title: "Furnished studio, Kalyani Nagar",
    price: "₹21,000/mo",
    match: 94,
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=400&q=80",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    x: 52,
    y: 60
  },
  {
    id: "h5",
    title: "3BHK near Hinjewadi Phase 1",
    price: "₹45,000/mo",
    match: 85,
    image: "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=400&q=80",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=100&q=80",
    x: 80,
    y: 80
  },
  {
    id: "h6",
    title: "Private room, Aundh",
    price: "₹14,200/mo",
    match: 90,
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=400&q=80",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80",
    x: 45,
    y: 88
  }
];
