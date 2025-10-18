import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminProductManager from "@/components/admin/AdminProductManager";
import AIAgentPanel from "@/components/admin/AIAgentPanel";
import VoiceControl from "@/components/admin/VoiceControl";

const Admin = () => {
  const [selectedTab, setSelectedTab] = useState("products");

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Admin Dashboard
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Manage products, AI agents, and store settings
          </p>
        </motion.div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="agents">AI Agents</TabsTrigger>
            <TabsTrigger value="voice">Voice Control</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            <AdminProductManager />
          </TabsContent>

          <TabsContent value="agents" className="mt-6">
            <AIAgentPanel />
          </TabsContent>

          <TabsContent value="voice" className="mt-6">
            <VoiceControl />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
