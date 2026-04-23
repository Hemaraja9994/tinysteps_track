import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Calendar, Clock, User, Plus, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export default function AppointmentsModule({ baby }: { baby: any }) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    specialist: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '10:00',
    purpose: '',
    type: 'Consultation'
  });

  useEffect(() => {
    const q = query(collection(db, 'babies', baby.id, 'appointments'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [baby.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'babies', baby.id, 'appointments'), {
        ...formData,
        status: 'Scheduled',
        createdAt: serverTimestamp()
      });
      setIsAddOpen(false);
      setFormData({ specialist: '', date: format(new Date(), 'yyyy-MM-dd'), time: '10:00', purpose: '', type: 'Consultation' });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Specialist Appointments</h2>
          <p className="text-muted-foreground font-medium text-sm">Coordinate follow-up care with multidisciplinary teams.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger nativeButton={false} render={
            <Button className="bg-indigo-600 rounded-xl font-bold gap-2">
              <Plus className="w-4 h-4" /> Schedule Visit
            </Button>
          } />
          <DialogContent className="rounded-3xl bg-background border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Schedule Appointment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Specialist / Department</Label>
                <Input value={formData.specialist} onChange={e => setFormData({...formData, specialist: e.target.value})} placeholder="e.g. Dr. Ramesh (Audiology)" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Purpose</Label>
                <Input value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} placeholder="e.g. Initial ABR Screening" required />
              </div>
              <Button type="submit" className="w-full bg-indigo-600 rounded-xl font-bold h-12">Confirm Schedule</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {appointments.map((appt) => (
          <Card key={appt.id} className="border border-border rounded-[32px] overflow-hidden bg-card transition-all">
            <CardContent className="p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl flex items-center justify-center">
                  <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase">
                  {appt.status}
                </div>
              </div>
              <h3 className="text-xl font-black text-foreground mb-1">{appt.specialist}</h3>
              <p className="text-sm font-bold text-muted-foreground mb-6 uppercase tracking-widest">{appt.purpose}</p>
              
              <div className="flex items-center gap-6 pt-6 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-bold text-foreground">{format(new Date(appt.date), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-bold text-foreground">{appt.time}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {appointments.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-[40px] bg-muted/20">
            <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-bold italic">No upcoming appointments scheduled.</p>
          </div>
        )}
      </div>
    </div>
  );
}
