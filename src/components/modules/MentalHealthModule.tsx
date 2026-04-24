import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Heart, Brain, Smile, AlertTriangle, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { safeFormat } from '../../lib/utils';

export default function MentalHealthModule({ baby }: { baby: any }) {
  const [records, setRecords] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    parentStressLevel: 5,
    notes: '',
    supportProvided: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'babies', baby.id, 'mentalHealth'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [baby.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'babies', baby.id, 'mentalHealth'), {
        ...formData,
        recordedAt: serverTimestamp()
      });
      setIsAddOpen(false);
      setFormData({ date: format(new Date(), 'yyyy-MM-dd'), parentStressLevel: 5, notes: '', supportProvided: '' });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-orange-50 p-8 rounded-[40px] border border-orange-100 flex items-center justify-between shadow-sm shadow-orange-50">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-3xl shadow-sm">
            🧡
          </div>
          <div>
            <h2 className="text-2xl font-black text-orange-900 leading-tight">Parental Well-being</h2>
            <p className="text-orange-700/70 text-sm font-bold mt-1 uppercase tracking-wider">Tracking emotional health and support</p>
          </div>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger nativeButton={false} render={
            <Button className="bg-orange-600 hover:bg-orange-700 h-12 px-6 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-lg shadow-orange-100">
              <Plus className="mr-2 h-4 w-4" />
              Update Well-being
            </Button>
          } />
          <DialogContent className="rounded-3xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Support Check-in</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="font-black text-slate-700 uppercase text-[10px] tracking-widest">Stress Level (1-10)</Label>
                  <span className="text-2xl font-black text-orange-600 tracking-tighter">{formData.parentStressLevel}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  step="1" 
                  value={formData.parentStressLevel} 
                  onChange={e => setFormData({...formData, parentStressLevel: Number(e.target.value)})}
                  className="w-full accent-orange-600 h-2 bg-orange-100 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  <span>Balanced</span>
                  <span>Normal</span>
                  <span>Intense</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Observations / Emotions</Label>
                <textarea 
                  className="w-full flex min-h-[100px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="How are you feeling today? Share your thoughts..."
                />
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Support Received / Needed</Label>
                <Input value={formData.supportProvided} onChange={e => setFormData({...formData, supportProvided: e.target.value})} placeholder="e.g. Counseling, family help..." className="rounded-xl border-slate-200" />
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Date</Label>
                <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required className="rounded-xl border-slate-200" />
              </div>

              <Button type="submit" className="w-full bg-orange-600 h-12 rounded-xl font-black text-white text-lg">Safely Log Status</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {records.map((r) => (
          <Card key={r.id} className="border border-slate-100 shadow-sm relative overflow-hidden rounded-[32px] group bg-white shadow-orange-100/30">
            <div className={`absolute top-0 right-0 w-12 h-12 flex items-center justify-center rounded-bl-3xl ${r.parentStressLevel > 7 ? 'bg-rose-500 text-white' : r.parentStressLevel > 4 ? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white'}`}>
               {r.parentStressLevel > 7 ? <AlertTriangle className="w-5 h-5" /> : <Smile className="w-5 h-5" />}
            </div>
            <CardHeader className="p-8 pb-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{safeFormat(r.date, 'MMMM dd, yyyy')}</span>
                  <div className="flex items-center gap-2">
                     <span className="text-2xl font-black text-slate-900 tracking-tighter">Stress Level {r.parentStressLevel}/10</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <div className="space-y-5">
                 <div className="bg-slate-50 p-6 rounded-2xl border-l-4 border-orange-200">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Observations</p>
                   <p className="text-sm font-medium text-slate-700 leading-relaxed italic">"{r.notes || 'No specific observations provided for this date.'}"</p>
                 </div>
                 {r.supportProvided && (
                   <div className="bg-orange-50/30 p-5 rounded-2xl border border-orange-100">
                     <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Care & Support</p>
                     <p className="text-sm text-orange-900 font-bold tracking-tight">{r.supportProvided}</p>
                   </div>
                 )}
              </div>
            </CardContent>
          </Card>
        ))}

        {records.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-100">
             <Brain className="w-12 h-12 text-purple-200 mx-auto mb-4" />
             <p className="text-slate-400">Regularly check-in on your emotional well-being here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
