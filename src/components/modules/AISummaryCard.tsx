import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Brain, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { interpretClinicalData } from '../../services/aiService';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';

interface AISummaryCardProps {
  baby: any;
  growthData: any[];
  hearingData: any[];
  eyeData: any[];
  milestoneData: any[];
  vaccinationData: any[];
}

export default function AISummaryCard({ baby, growthData, hearingData, eyeData, milestoneData, vaccinationData }: AISummaryCardProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    const result = await interpretClinicalData(baby, growthData, hearingData, eyeData, milestoneData, vaccinationData);
    setSummary(result || "No interpretation available.");
    setLoading(false);
  };

  useEffect(() => {
    // Generate automatically on first load if any dataset has data
    if (growthData.length > 0 || hearingData.length > 0 || eyeData.length > 0 || milestoneData.length > 0 || vaccinationData.length > 0) {
      generateSummary();
    }
  }, [baby.id]);

  return (
    <Card className="border border-indigo-100 dark:border-indigo-900/50 rounded-[32px] overflow-hidden shadow-sm bg-indigo-50/30 dark:bg-indigo-950/10">
      <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl font-black text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
            <Brain className="w-6 h-6" />
            AI Clinical Interpretation
          </CardTitle>
          <CardDescription className="font-bold text-indigo-500/70 uppercase text-[10px] tracking-widest mt-1">powered by gemini</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={generateSummary} 
          disabled={loading}
          className="rounded-xl border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          {summary ? 'Regenerate' : 'Analyze Data'}
        </Button>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 180, 270, 360] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-2xl flex items-center justify-center"
            >
              <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </motion.div>
            <p className="text-sm font-bold text-indigo-600/60 dark:text-indigo-400/60 animate-pulse uppercase tracking-widest">Processing Parameters...</p>
          </div>
        ) : summary ? (
          <div className="prose dark:prose-invert prose-sm max-w-none text-foreground prose-headings:text-indigo-700 dark:prose-headings:text-indigo-400 prose-headings:font-black prose-p:font-medium">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        ) : (
          <div className="py-8 text-center bg-white/50 dark:bg-black/20 rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-900">
            <p className="text-sm text-indigo-400 font-bold italic">No screening data available for AI analysis yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
