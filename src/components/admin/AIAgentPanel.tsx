import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Bot, Zap, Activity } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  type: "lemonai" | "autoagent";
  status: "active" | "inactive" | "processing";
  description: string;
}

const AIAgentPanel = () => {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: "lemon-1",
      name: "LemonAI Product Optimizer",
      type: "lemonai",
      status: "active",
      description: "Optimizes product descriptions and pricing using AI analysis"
    },
    {
      id: "auto-1",
      name: "AutoAgent Customer Support",
      type: "autoagent",
      status: "active",
      description: "Handles customer inquiries and provides intelligent responses"
    }
  ]);

  const [naturalLanguageInput, setNaturalLanguageInput] = useState("");
  const [processingCommand, setProcessingCommand] = useState(false);

  const handleNaturalLanguageCommand = async () => {
    if (!naturalLanguageInput.trim()) return;

    setProcessingCommand(true);
    
    // Simulate AI processing
    setTimeout(() => {
      console.log("Processing command:", naturalLanguageInput);
      setNaturalLanguageInput("");
      setProcessingCommand(false);
    }, 1500);
  };

  const toggleAgentStatus = (id: string) => {
    setAgents(agents.map(agent => {
      if (agent.id === id) {
        return {
          ...agent,
          status: agent.status === "active" ? "inactive" : "active"
        };
      }
      return agent;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Natural Language Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Natural Language AI Control
          </CardTitle>
          <CardDescription>
            Control agents using natural language commands
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nl-input">Enter Command</Label>
            <Textarea
              id="nl-input"
              value={naturalLanguageInput}
              onChange={(e) => setNaturalLanguageInput(e.target.value)}
              placeholder="Example: Analyze all product prices and suggest optimizations..."
              rows={3}
              className="resize-none"
            />
          </div>

          <Button 
            onClick={handleNaturalLanguageCommand}
            disabled={processingCommand || !naturalLanguageInput.trim()}
            className="w-full"
          >
            {processingCommand ? (
              <>
                <Activity className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Execute Command
              </>
            )}
          </Button>

          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-semibold mb-2">Example Commands:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• "Update all product descriptions to be more compelling"</li>
              <li>• "Analyze customer feedback and suggest improvements"</li>
              <li>• "Generate marketing copy for new arrivals"</li>
              <li>• "Optimize product images for better conversions"</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* LemonAI Agent */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-yellow-500" />
                LemonAI Agent
              </CardTitle>
              <CardDescription>
                Advanced AI for product optimization and insights
              </CardDescription>
            </div>
            <Badge variant="secondary">
              <a 
                href="https://github.com/hexdocom/lemonai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
              >
                View on GitHub
              </a>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {agents.filter(a => a.type === "lemonai").map(agent => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="space-y-1">
                <h3 className="font-semibold">{agent.name}</h3>
                <p className="text-sm text-muted-foreground">{agent.description}</p>
                <Badge variant={agent.status === "active" ? "default" : "secondary"}>
                  {agent.status}
                </Badge>
              </div>
              <Switch
                checked={agent.status === "active"}
                onCheckedChange={() => toggleAgentStatus(agent.id)}
              />
            </motion.div>
          ))}

          <div className="rounded-lg bg-blue-500/10 border-blue-500/20 border p-4 text-sm">
            <p className="font-semibold text-blue-600 dark:text-blue-400 mb-2">
              LemonAI Features:
            </p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Natural language processing for e-commerce</li>
              <li>• Product description optimization</li>
              <li>• Dynamic pricing recommendations</li>
              <li>• Customer behavior analysis</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* AutoAgent */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-500" />
                AutoAgent
              </CardTitle>
              <CardDescription>
                Autonomous agent for automated workflows
              </CardDescription>
            </div>
            <Badge variant="secondary">
              <a 
                href="https://github.com/HKUDS/AutoAgent" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
              >
                View on GitHub
              </a>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {agents.filter(a => a.type === "autoagent").map(agent => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="space-y-1">
                <h3 className="font-semibold">{agent.name}</h3>
                <p className="text-sm text-muted-foreground">{agent.description}</p>
                <Badge variant={agent.status === "active" ? "default" : "secondary"}>
                  {agent.status}
                </Badge>
              </div>
              <Switch
                checked={agent.status === "active"}
                onCheckedChange={() => toggleAgentStatus(agent.id)}
              />
            </motion.div>
          ))}

          <div className="rounded-lg bg-purple-500/10 border-purple-500/20 border p-4 text-sm">
            <p className="font-semibold text-purple-600 dark:text-purple-400 mb-2">
              AutoAgent Features:
            </p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Autonomous task execution</li>
              <li>• Intelligent workflow automation</li>
              <li>• Self-improving algorithms</li>
              <li>• Multi-agent coordination</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAgentPanel;
