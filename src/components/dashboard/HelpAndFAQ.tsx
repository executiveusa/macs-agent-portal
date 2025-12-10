import { useState } from "react";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { BookMarked, LifeBuoy, Map, PlayCircle } from "lucide-react";

const faqs = [
  {
    question: "What is Maxx Coze Studio and why is it in this dashboard?",
    answer:
      "Maxx Coze Studio is an open-source agent platform that powers prompts, workflows, plugins, and deployment automation. The MACS admin dashboard now mirrors that environment so you can configure everything from one place.",
  },
  {
    question: "How do I launch a new agent?",
    answer:
      "Start inside the Agent command hub, choose the agent template, and click \"Promote\". The request triggers Studio workflows that validate prompts, refresh datasets, and push the package into production.",
  },
  {
    question: "Can I customize functions for my team?",
    answer:
      "Yes. Edit prompts, workflows, or plugins directly within the linked repository, then run the Release pipeline. Once the CI job completes, refreshed assets appear in this dashboard automatically.",
  },
  {
    question: "What are the best use cases?",
    answer:
      "Customer success co-pilots, research analysts, operations automation, analytics explainers, and compliance assistants. The portal ships with starter kits for each persona to accelerate adoption.",
  },
];

const HelpAndFAQ = () => {
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <section id="help" className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-semibold tracking-tight text-white">Help & FAQ</h2>
        <p className="max-w-2xl text-sm text-slate-300">
          Need guidance? Explore our quick-start walkthrough or browse the most common questions before you ship your next agent.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <motion.div
          className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.question} value={`faq-${index}`} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
                <AccordionTrigger className="px-4 py-3 text-left text-sm font-semibold text-white">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-sm text-slate-300">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
        <motion.aside
          className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200 backdrop-blur"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <LifeBuoy className="h-6 w-6 text-emerald-300" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-white">Guided onboarding</p>
              <p className="text-xs text-slate-300">Follow a step-by-step tour of the dashboard and Studio features.</p>
            </div>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-500/80 text-slate-950 hover:bg-emerald-400">
                <PlayCircle className="mr-2 h-4 w-4" aria-hidden="true" /> Launch interactive tour
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl border-white/10 bg-slate-950/95 text-slate-100">
              <DialogHeader>
                <DialogTitle className="text-lg text-white">Interactive walkthrough</DialogTitle>
                <DialogDescription className="text-sm text-slate-300">
                  This guided flow mirrors the official Maxx Coze Studio quickstart. Review the highlights, then explore the
                  detailed documentation linked below.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm text-slate-200">
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="font-semibold text-white">1. Clone & configure</p>
                  <p className="text-xs text-slate-300">Pull the repository, configure model credentials, and seed your plugin secrets.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="font-semibold text-white">2. Build & validate</p>
                  <p className="text-xs text-slate-300">Use Studio's visual editors to craft prompts and workflows, then run the validation suite.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="font-semibold text-white">3. Deploy & monitor</p>
                  <p className="text-xs text-slate-300">Promote the agent to production, monitor metrics here, and iterate quickly.</p>
                </div>
              </div>
              <Separator className="border-white/10" />
              <div className="flex flex-wrap gap-3 text-xs text-emerald-200">
                <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                  <a href="https://github.com/executiveusa/maxx-coze-studio" target="_blank" rel="noreferrer">
                    <BookMarked className="mr-2 h-4 w-4" aria-hidden="true" /> View repository docs
                  </a>
                </Button>
                <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                  <a href="https://www.coze.cn/open/docs" target="_blank" rel="noreferrer">
                    <Map className="mr-2 h-4 w-4" aria-hidden="true" /> Browse official guides
                  </a>
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.aside>
      </div>
    </section>
  );
};

export default HelpAndFAQ;
