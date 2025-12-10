import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Upload, GripVertical, Plus } from "lucide-react";

interface ProductImage {
  id: string;
  url: string;
  order: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "hats" | "tshirts";
  images: ProductImage[];
  stock: number;
}

const AdminProductManager = () => {
  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      name: "Classic Mustang Cap",
      description: "Premium cotton cap",
      price: 29.99,
      category: "hats",
      images: [
        { id: "img1", url: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&h=500&fit=crop", order: 0 }
      ],
      stock: 25
    }
  ]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    description: "",
    price: 0,
    category: "hats",
    images: [],
    stock: 0
  });

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.price) {
      const product: Product = {
        id: Date.now().toString(),
        name: newProduct.name,
        description: newProduct.description || "",
        price: newProduct.price,
        category: newProduct.category || "hats",
        images: newProduct.images || [],
        stock: newProduct.stock || 0
      };
      setProducts([...products, product]);
      setNewProduct({ name: "", description: "", price: 0, category: "hats", images: [], stock: 0 });
    }
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    if (selectedProduct?.id === id) {
      setSelectedProduct(null);
    }
  };

  const handleAddImage = (productId: string, imageUrl: string) => {
    setProducts(products.map(p => {
      if (p.id === productId) {
        const newImage: ProductImage = {
          id: Date.now().toString(),
          url: imageUrl,
          order: p.images.length
        };
        return { ...p, images: [...p.images, newImage] };
      }
      return p;
    }));
  };

  const handleDeleteImage = (productId: string, imageId: string) => {
    setProducts(products.map(p => {
      if (p.id === productId) {
        return { ...p, images: p.images.filter(img => img.id !== imageId) };
      }
      return p;
    }));
  };

  const handleReorderImages = (productId: string, fromIndex: number, toIndex: number) => {
    setProducts(products.map(p => {
      if (p.id === productId) {
        const newImages = [...p.images];
        const [removed] = newImages.splice(fromIndex, 1);
        newImages.splice(toIndex, 0, removed);
        return { ...p, images: newImages.map((img, idx) => ({ ...img, order: idx })) };
      }
      return p;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Add New Product */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Product</CardTitle>
          <CardDescription>Create a new product for the shop</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={newProduct.name || ""}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="Enter product name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={newProduct.price || ""}
                onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newProduct.description || ""}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              placeholder="Enter product description"
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={newProduct.category}
                onValueChange={(value: "hats" | "tshirts") => setNewProduct({ ...newProduct, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hats">Hats</SelectItem>
                  <SelectItem value="tshirts">T-Shirts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={newProduct.stock || ""}
                onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })}
                placeholder="0"
              />
            </div>
          </div>

          <Button onClick={handleAddProduct} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </CardContent>
      </Card>

      {/* Product List */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Products</CardTitle>
          <CardDescription>View, edit, and delete existing products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {products.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  {product.images[0] && (
                    <img
                      src={product.images[0].url}
                      alt={product.name}
                      className="h-16 w-16 rounded object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">${product.price}</p>
                    <div className="mt-1 flex gap-2">
                      <Badge variant="secondary">{product.category}</Badge>
                      <Badge variant="outline">{product.stock} in stock</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedProduct(product);
                      setIsEditing(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}

            {products.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                No products yet. Add your first product above.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Manager for Selected Product */}
      {selectedProduct && isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Manage Images: {selectedProduct.name}</CardTitle>
            <CardDescription>Add, remove, and reorder product images</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {selectedProduct.images.map((image, index) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-square overflow-hidden rounded-lg border">
                    <img
                      src={image.url}
                      alt={`Product ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDeleteImage(selectedProduct.id, image.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-xs text-white">
                    <GripVertical className="h-3 w-3" />
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Enter image URL"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.currentTarget;
                    if (input.value) {
                      handleAddImage(selectedProduct.id, input.value);
                      input.value = "";
                    }
                  }
                }}
              />
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Add Image
              </Button>
            </div>

            <Button variant="secondary" onClick={() => setIsEditing(false)}>
              Close
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminProductManager;
