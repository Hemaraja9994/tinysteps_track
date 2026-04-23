import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { ClipboardCheck, Plus, Download, BarChart2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';

const OUTCOME_TEMPLATES = [
  { id: 'PARCA-R', name: 'PARCA-R', desc: 'Parent Report of Children\'s Abilities-Revised', age: '24 Months' },
  { id: 'SDQ', name: 'SDQ (2-4y)', desc: 'Strengths and Difficulties Questionnaire', age: '2-4 Years' },
  { id: 'M-CHAT-R', name: 'M-CHAT-R', desc: 'Modified Checklist for Autism in Toddlers', age: '16-30 Months' },
];

export default function OutcomeModule({ baby }: { baby: any }) {
  const [assessments, setAssessments] = useState<any[]>([]);

  const addMockAssessment = (type: string) => {
    const newAss = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      date: new Date().toISOString(),
      score: 'Normal Range',
      summary: 'Development is within target range for corrected age.'
    };
    setAssessments([newAss, ...assessments]);
  };

  return (
    <div className="space-y-8">
      <div className="bg-indigo-50 p-8 rounded-[40px] border border-indigo-100 shadow-sm shadow-indigo-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-black text-indigo-900 leading-tight">Outcome Measures</h2>
            <p className="text-indigo-700/70 text-sm font-bold mt-1 uppercase tracking-wider">Formal Benchmarking Tools</p>
          </div>
          <div className="px-4 py-2 bg-white rounded-2xl border border-indigo-100 text-[10px] font-black text-indigo-600 uppercase tracking-widest shadow-sm">
            Standardized Scales
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {OUTCOME_TEMPLATES.map(t => (
            <Card key={t.id} className="border border-indigo-100 shadow-md rounded-3xl overflow-hidden group hover:translate-y-[-4px] transition-all bg-white">
              <CardHeader className="p-6">
                <Badge className="bg-indigo-50 text-indigo-600 border-none font-black text-[9px] uppercase tracking-widest mb-3">{t.age}</Badge>
                <CardTitle className="text-xl font-black text-slate-900 tracking-tight leading-tight">{t.name}</CardTitle>
                <CardDescription className="text-xs font-medium text-slate-400 mt-2 line-clamp-2">{t.desc}</CardDescription>
                <Button 
                   className="mt-6 w-full h-11 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-black text-[10px] uppercase tracking-widest text-white shadow-lg shadow-indigo-100 transition-all group-hover:scale-[1.02]"
                   onClick={() => addMockAssessment(t.id)}
                >
                  <Plus className="w-4 h-4 mr-2" /> Start Now
                </Button>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
          <div className="p-2 bg-slate-100 rounded-xl"><HistoryIcon /></div>
          Assessment Log
        </h3>
        
        {assessments.map(a => (
          <Card key={a.id} className="border border-slate-100 shadow-sm overflow-hidden rounded-[32px] bg-white group hover:shadow-xl transition-all">
             <CardContent className="p-0">
               <div className="flex items-center p-8 gap-6">
                  <div className="w-16 h-16 bg-slate-50 group-hover:bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0 transition-colors">
                    <ClipboardCheck className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-2xl font-black text-slate-900 tracking-tighter">{a.type}</span>
                      <Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-[9px] px-2 py-0.5">IN TARGET</Badge>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed on {format(new Date(a.date), 'MMMM dd, yyyy')}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-100 transition-all"><Download className="w-5 h-5" /></Button>
                    <Button size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-100 transition-all"><BarChart2 className="w-5 h-5" /></Button>
                  </div>
               </div>
               <div className="bg-slate-50 px-8 py-5 text-sm font-medium text-slate-600 border-t border-slate-100 italic">
                  <span className="font-black text-indigo-600 uppercase text-[10px] tracking-widest mr-3">Summary:</span> {a.summary}
               </div>
             </CardContent>
          </Card>
        ))}

        {assessments.length === 0 && (
          <div className="py-12 text-center text-slate-400 italic">
            No standardized assessments completed yet.
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
  );
}
