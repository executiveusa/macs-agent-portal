import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const VoiceControl = () => {
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);

  // Check if browser supports Web Speech API
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setVoiceEnabled(true);
    }
  }, []);

  const startListening = () => {
    if (!voiceEnabled) {
      toast({
        title: "Voice Control Not Supported",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive"
      });
      return;
    }

    setIsListening(true);
    toast({
      title: "Listening...",
      description: "Speak your command now"
    });

    // Simulate voice recognition
    setTimeout(() => {
      const sampleCommands = [
        "Show all products",
        "Update pricing for hats",
        "Generate product descriptions",
        "Analyze customer feedback"
      ];
      const randomCommand = sampleCommands[Math.floor(Math.random() * sampleCommands.length)];
      setTranscript(randomCommand);
      setCommandHistory(prev => [randomCommand, ...prev.slice(0, 9)]);
      setIsListening(false);
      
      toast({
        title: "Command Received",
        description: randomCommand
      });
    }, 2000);
  };

  const stopListening = () => {
    setIsListening(false);
  };

  return (
    <div className="space-y-6">
      {/* Voice Control Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Voice Control Center
          </CardTitle>
          <CardDescription>
            Control the admin panel using voice commands
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              {voiceEnabled ? (
                <Volume2 className="h-8 w-8 text-green-500" />
              ) : (
                <VolumeX className="h-8 w-8 text-muted-foreground" />
              )}
              <div>
                <h3 className="font-semibold">Voice Recognition Status</h3>
                <Badge variant={voiceEnabled ? "default" : "secondary"}>
                  {voiceEnabled ? "Available" : "Not Available"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Voice Control Button */}
          <div className="flex flex-col items-center gap-4 py-8">
            <motion.button
              className={`relative flex h-32 w-32 items-center justify-center rounded-full transition-all ${
                isListening 
                  ? "bg-red-500 hover:bg-red-600" 
                  : "bg-primary hover:bg-primary/90"
              }`}
              onClick={isListening ? stopListening : startListening}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={isListening ? {
                boxShadow: [
                  "0 0 0 0 rgba(239, 68, 68, 0.7)",
                  "0 0 0 20px rgba(239, 68, 68, 0)",
                ]
              } : {}}
              transition={isListening ? { repeat: Infinity, duration: 1.5 } : {}}
            >
              {isListening ? (
                <MicOff className="h-12 w-12 text-white" />
              ) : (
                <Mic className="h-12 w-12 text-white" />
              )}
            </motion.button>
            
            <div className="text-center">
              <p className="text-lg font-semibold">
                {isListening ? "Listening..." : "Click to speak"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isListening ? "Say your command" : "Press and speak your command"}
              </p>
            </div>
          </div>

          {/* Current Transcript */}
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border bg-muted p-4"
            >
              <p className="text-sm font-semibold mb-1">Last Command:</p>
              <p className="text-lg">{transcript}</p>
            </motion.div>
          )}

          {/* Supported Commands */}
          <div className="rounded-lg bg-blue-500/10 border-blue-500/20 border p-4 text-sm">
            <p className="font-semibold text-blue-600 dark:text-blue-400 mb-2">
              Supported Voice Commands:
            </p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• "Show all products"</li>
              <li>• "Add new product"</li>
              <li>• "Update pricing"</li>
              <li>• "Generate descriptions"</li>
              <li>• "Analyze performance"</li>
              <li>• "Run AI optimization"</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Command History */}
      {commandHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Command History</CardTitle>
            <CardDescription>Recent voice commands</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {commandHistory.map((command, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2 rounded-lg border p-3 text-sm"
                >
                  <Mic className="h-4 w-4 text-muted-foreground" />
                  <span>{command}</span>
                  <Badge variant="outline" className="ml-auto">
                    {index === 0 ? "Latest" : `${index + 1}`}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VoiceControl;
