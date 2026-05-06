import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Zap, Activity } from "lucide-react";
import { AGENT_MAX_BRAND, AGENT_MAX_PROFILES, AGENT_MAX_PROVIDERS } from "@/config/agentMaxConfig";
import { runAgentMaxCommand } from "@/services/agentMaxService";
import type { AgentProfile, ProviderId } from "@/types/agentMax";

const AIAgentPanel = () => {
  const [agents, setAgents] = useState<AgentProfile[]>(AGENT_MAX_PROFILES);
  const [naturalLanguageInput, setNaturalLanguageInput] = useState("");
  const [processingCommand, setProcessingCommand] = useState(false);
  const [provider, setProvider] = useState<ProviderId>("openai");
  const [targetAgent, setTargetAgent] = useState<"auto" | "big-max" | "little-max">("auto");
  const [approvalMode, setApprovalMode] = useState<"approval" | "yolo">("approval");
  const [lastRunSummary, setLastRunSummary] = useState<string>("");

  const providerOptions = useMemo(() => Object.entries(AGENT_MAX_PROVIDERS), []);

  const handleNaturalLanguageCommand = async () => {
    if (!naturalLanguageInput.trim()) return;

    setProcessingCommand(true);

    const result = await runAgentMaxCommand({
      command: naturalLanguageInput,
      target: targetAgent,
      provider,
      approvalMode,
    });

    setLastRunSummary(`${result.summary} (${new Date(result.createdAt).toLocaleString()})`);
    setNaturalLanguageInput("");
    setProcessingCommand(false);
  };

  const toggleAgentStatus = (id: string) => {
    setAgents(
      agents.map((agent) => {
        if (agent.id === id) {
          return {
            ...agent,
            status: agent.status === "active" ? "inactive" : "active",
          };
        }
        return agent;
      }),
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {AGENT_MAX_BRAND.platformName} Command Center
          </CardTitle>
          <CardDescription>
            Run backend workflows for {AGENT_MAX_BRAND.workspaceAgents.primary} and {" "}
            {AGENT_MAX_BRAND.workspaceAgents.secondary} from one control panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Model Provider</Label>
              <Select value={provider} onValueChange={(value) => setProvider(value as ProviderId)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providerOptions.map(([key, item]) => (
                    <SelectItem key={key} value={key}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Agent</Label>
              <Select value={targetAgent} onValueChange={(value) => setTargetAgent(value as typeof targetAgent)}>
                <SelectTrigger>
                  <SelectValue placeholder="Auto route" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto route</SelectItem>
                  <SelectItem value="big-max">Big Max</SelectItem>
                  <SelectItem value="little-max">Little Max</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Approval Mode</Label>
              <Select value={approvalMode} onValueChange={(value) => setApprovalMode(value as typeof approvalMode)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approval">Approval-first</SelectItem>
                  <SelectItem value="yolo">YOLO mode</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nl-input">Enter Command</Label>
            <Textarea
              id="nl-input"
              value={naturalLanguageInput}
              onChange={(e) => setNaturalLanguageInput(e.target.value)}
              placeholder="Example: sync inbound leads from WhatsApp and post status summary to Discord"
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

          {lastRunSummary && <div className="rounded-lg bg-muted p-4 text-sm">{lastRunSummary}</div>}
        </CardContent>
      </Card>

      {agents.map((agent) => (
        <Card key={agent.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-yellow-500" />
                  {agent.name}
                </CardTitle>
                <CardDescription>{agent.description}</CardDescription>
              </div>
              <Badge variant="secondary">{agent.upstreamBase}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="space-y-1">
                <h3 className="font-semibold">{agent.role}</h3>
                <p className="text-sm text-muted-foreground">Codename: {agent.codename}</p>
                <Badge variant={agent.status === "active" ? "default" : "secondary"}>{agent.status}</Badge>
              </div>
              <Switch checked={agent.status === "active"} onCheckedChange={() => toggleAgentStatus(agent.id)} />
            </motion.div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AIAgentPanel;
