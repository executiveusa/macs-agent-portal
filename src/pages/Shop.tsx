import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "hats" | "tshirts";
  image: string;
  stock: number;
}

// Stock product data - will be managed by admin later
const initialProducts: Product[] = [
  {
    id: "hat-1",
    name: "Classic Mustang Cap",
    description: "Embroidered Mustang logo on premium cotton cap",
    price: 29.99,
    category: "hats",
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&h=500&fit=crop",
    stock: 25
  },
  {
    id: "hat-2",
    name: "Vintage Racing Hat",
    description: "Retro-style racing cap with adjustable strap",
    price: 34.99,
    category: "hats",
    image: "https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=500&h=500&fit=crop",
    stock: 18
  },
  {
    id: "hat-3",
    name: "Performance Snapback",
    description: "Moisture-wicking performance cap for track days",
    price: 32.99,
    category: "hats",
    image: "https://images.unsplash.com/photo-1529958030586-3aae4ca485ff?w=500&h=500&fit=crop",
    stock: 30
  },
  {
    id: "tshirt-1",
    name: "Mustang Max Hero Tee",
    description: "Premium cotton tee with Mustang Max graphic",
    price: 39.99,
    category: "tshirts",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
    stock: 40
  },
  {
    id: "tshirt-2",
    name: "Vintage Garage Shirt",
    description: "Soft blend tee with retro garage design",
    price: 36.99,
    category: "tshirts",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&h=500&fit=crop",
    stock: 35
  },
  {
    id: "tshirt-3",
    name: "Racing Stripes Tee",
    description: "Athletic fit with iconic racing stripes",
    price: 42.99,
    category: "tshirts",
    image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=500&h=500&fit=crop",
    stock: 28
  },
  {
    id: "tshirt-4",
    name: "Dark Horse Edition",
    description: "Limited edition Dark Horse inspired design",
    price: 44.99,
    category: "tshirts",
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&h=500&fit=crop",
    stock: 15
  },
  {
    id: "hat-4",
    name: "Shelby GT Trucker",
    description: "Mesh back trucker hat with Shelby emblem",
    price: 28.99,
    category: "hats",
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&h=500&fit=crop",
    stock: 22
  }
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const Shop = () => {
  const [products] = useState<Product[]>(initialProducts);
  const [filter, setFilter] = useState<"all" | "hats" | "tshirts">("all");

  const filteredProducts = filter === "all" 
    ? products 
    : products.filter(p => p.category === filter);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Mustang Max Shop
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Premium gear for Mustang enthusiasts and collectors
          </p>
        </motion.div>

        {/* Category Filter */}
        <div className="mb-8 flex justify-center gap-3">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            All Products
          </Button>
          <Button
            variant={filter === "hats" ? "default" : "outline"}
            onClick={() => setFilter("hats")}
          >
            Hats
          </Button>
          <Button
            variant={filter === "tshirts" ? "default" : "outline"}
            onClick={() => setFilter("tshirts")}
          >
            T-Shirts
          </Button>
        </div>

        {/* Product Grid */}
        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.1 }}
        >
          {filteredProducts.map((product) => (
            <motion.div key={product.id} variants={cardVariants}>
              <Card className="overflow-hidden transition-all hover:shadow-lg">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <Badge variant="secondary">
                      {product.category === "hats" ? "Hat" : "T-Shirt"}
                    </Badge>
                  </div>
                  <CardDescription>{product.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">${product.price}</span>
                    <span className="text-sm text-muted-foreground">
                      {product.stock} in stock
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" disabled={product.stock === 0}>
                    {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {filteredProducts.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">No products found in this category.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Shop;
