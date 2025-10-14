import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Mail, ShieldCheck, Sparkle, UserCircle, Wand2 } from "lucide-react";

const SignIn = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      <Navbar />
      <main className="container mx-auto flex flex-col gap-10 pb-16 pt-24 lg:flex-row lg:items-center">
        <motion.div
          className="flex-1 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="outline" className="border-emerald-400/60 bg-emerald-500/10 text-emerald-100">
            Secure access
          </Badge>
          <h1 className="text-4xl font-semibold text-white">Sign in to your agent cockpit</h1>
          <p className="max-w-xl text-sm text-slate-300">
            Authenticate with Google or email to unlock the Maxx Coze Studio powered dashboard. Access your agents, workflows,
            and monitoring tools from any device with enterprise-grade security controls.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {["Granular RBAC", "Audit trails", "Multi-region failover", "SAML ready"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                <ShieldCheck className="h-5 w-5 text-emerald-300" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400">
            Need help provisioning new users? Visit the <Link to="/dashboard#help" className="text-emerald-200 underline">help center</Link> for onboarding docs.
          </p>
        </motion.div>
        <motion.div
          className="flex-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-2xl text-white">Welcome back</CardTitle>
              <p className="text-sm text-slate-300">Choose your preferred sign-in method to continue.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full bg-white text-slate-900 hover:bg-slate-100">
                <UserCircle className="mr-2 h-5 w-5" aria-hidden="true" /> Continue with Google
              </Button>
              <div className="relative text-center text-xs uppercase tracking-[0.35em] text-slate-400">
                <Separator className="border-white/10" />
                <span className="absolute inset-x-0 -top-2 mx-auto w-max bg-white/5 px-3 py-1">Or use email</span>
              </div>
              <form className="space-y-4">
                <div className="space-y-2 text-left">
                  <Label htmlFor="email" className="text-xs text-slate-200">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@macs.digital"
                    className="border-white/10 bg-slate-900/70 text-sm text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2 text-left">
                  <Label htmlFor="password" className="text-xs text-slate-200">
                    Magic link or password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter secure passphrase"
                    className="border-white/10 bg-slate-900/70 text-sm text-white placeholder:text-slate-500"
                  />
                </div>
                <Button type="submit" className="w-full bg-emerald-500/80 text-slate-950 hover:bg-emerald-400">
                  <Mail className="mr-2 h-4 w-4" aria-hidden="true" /> Send access link
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                Use the Google option for the fastest setup—your MACS domain is pre-approved.
              </div>
              <div className="flex items-center gap-2">
                <Sparkle className="h-4 w-4 text-purple-300" aria-hidden="true" />
                First time? Your account will be provisioned with starter agents and sample workflows.
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default SignIn;
