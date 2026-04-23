import { useState, useEffect, useMemo } from 'react';
import { Shield, CheckCircle2, Info, ChevronRight, BellRing, MessageSquare, Phone, Download, Sparkles } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { format, addDays, isAfter } from 'date-fns';
import { collection, query, onSnapshot, setDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'sonner';

const BASE_SCHEDULE = [
  { id: 'birth', label: 'At Birth (or Stabilization)', vaccines: ['BCG', 'OPV-0', 'HBV-1'], dueOn: 0 },
  { id: '6w', label: '6 Weeks', vaccines: ['Hexavalent (DTwP-Hib-HBV-IPV)', 'PCV-1', 'Rotavirus-1'], dueOn: 42 },
  { id: '10w', label: '10 Weeks', vaccines: ['Hexavalent-2', 'PCV-2', 'Rotavirus-2'], dueOn: 70 },
  { id: '14w', label: '14 Weeks', vaccines: ['Hexavalent-3', 'PCV-3', 'Rotavirus-3'], dueOn: 98 },
  { id: '6m', label: '6 Months', vaccines: ['Influenza-1', 'OPV-1'], dueOn: 180 },
  { id: '9m', label: '9 Months', vaccines: ['MR-1 / MMR-1', 'Vitamin A'], dueOn: 270 },
  { id: '12m', label: '12 Months', vaccines: ['Hepatitis A-1', 'Chickenpox-1'], dueOn: 365 },
];

export default function VaccinationModule({ baby }: { baby: any }) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [useCorrectedAge, setUseCorrectedAge] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(baby.alerts?.vaccineReminders || false);

  useEffect(() => {
    const q = query(collection(db, 'babies', baby.id, 'vaccinations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCompleted(snapshot.docs.map((doc) => doc.id));
    });
    return unsubscribe;
  }, [baby.id]);

  const birthDate = new Date(baby.dob);
  const weeksToTerm = 40 - baby.gestationalAgeAtBirth;
  const termDate = addDays(birthDate, Math.max(0, weeksToTerm * 7));

  const schedule = useMemo(() => {
    return BASE_SCHEDULE.map((item) => {
      const baseDate = useCorrectedAge ? termDate : birthDate;
      const dueDate = addDays(baseDate, item.dueOn);
      const isDone = completed.includes(item.id);
      const isOverdue = isAfter(new Date(), dueDate) && !isDone;
      const isUpcoming = isAfter(dueDate, new Date()) && isAfter(addDays(new Date(), 7), dueDate) && !isDone;
      return { ...item, dueDate, isDone, isOverdue, isUpcoming };
    });
  }, [birthDate, termDate, completed, useCorrectedAge]);

  const stats = useMemo(() => {
    return {
      total: schedule.length,
      completed: schedule.filter((item) => item.isDone).length,
      pending: schedule.filter((item) => !item.isDone).length,
      overdue: schedule.filter((item) => item.isOverdue).length,
    };
  }, [schedule]);

  const toggleVaccine = async (id: string) => {
    try {
      const vRef = doc(db, 'babies', baby.id, 'vaccinations', id);
      if (completed.includes(id)) {
        await deleteDoc(vRef);
        toast.info('Vaccine marked as pending');
      } else {
        await setDoc(vRef, {
          completedAt: new Date().toISOString(),
          id,
        });
        toast.success('Vaccine record updated');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update record');
    }
  };

  const toggleReminders = async (checked: boolean) => {
    setRemindersEnabled(checked);
    try {
      await updateDoc(doc(db, 'babies', baby.id), {
        'alerts.vaccineReminders': checked,
      });
      toast.success(checked ? 'Automated vaccine reminders enabled' : 'Reminders disabled');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update preferences');
    }
  };

  const sendManualReminder = (item: any) => {
    if (!baby.alerts?.sms && !baby.alerts?.whatsapp) {
      toast.error('Alerts not configured', {
        description: 'Enable SMS or WhatsApp in Care Coordination first.',
      });
      return;
    }

    if (!baby.alerts?.verified) {
      toast.error('Number not verified', {
        description: 'Parent mobile number must be verified for reminders.',
      });
      return;
    }

    const method = baby.alerts.whatsapp ? 'WhatsApp' : 'SMS';
    const ageType = useCorrectedAge ? 'Corrected' : 'Chronological';

    toast.success('Reminder sent', {
      description: `${item.label} reminder using ${ageType} age was sent via ${method}.`,
    });
  };

  const exportReport = () => {
    const content = [
      'VACCINATION SUMMARY',
      '',
      `Baby Name: ${baby.name}`,
      `Date of Birth: ${format(birthDate, 'MMM dd, yyyy')}`,
      `Age Basis: ${useCorrectedAge ? 'Corrected age' : 'Chronological age'}`,
      '',
      ...schedule.map((item) => `${item.label}: ${item.isDone ? 'Completed' : item.isOverdue ? 'Overdue' : item.isUpcoming ? 'Due soon' : 'Pending'} | Due ${format(item.dueDate, 'MMM dd, yyyy')} | ${item.vaccines.join(', ')}`),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${baby.name.replace(/\s+/g, '-').toLowerCase()}-vaccination-summary.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
        <div className="hero-panel rounded-[1.9rem] p-5 sm:p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white/15 text-white shadow-inner ring-1 ring-white/20">
                <Shield className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <Badge className="w-fit border-none bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white">
                  Immunization module
                </Badge>
                <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Vaccines and reminder workflow</h2>
                <p className="max-w-2xl text-sm font-medium leading-6 text-white/80">
                  Keep the schedule readable, flag overdue doses clearly, and coordinate reminders using chronological or corrected age.
                </p>
                {baby.alerts?.verified && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-500/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-100">
                    {baby.alerts?.whatsapp ? <MessageSquare className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
                    Active alerts {baby.alerts.phoneNumber}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="soft-panel rounded-[1.4rem] p-4">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="age-toggle" className="text-[10px] font-black uppercase tracking-[0.22em] text-white">Use corrected age</Label>
                  <Switch id="age-toggle" checked={useCorrectedAge} onCheckedChange={setUseCorrectedAge} className="data-[state=checked]:bg-emerald-500" />
                </div>
                <p className="mt-3 text-xs font-semibold text-white/70">
                  {useCorrectedAge ? 'Schedule is being adjusted from term-equivalent age.' : 'Schedule is based on chronological age.'}
                </p>
              </div>

              <div className="soft-panel rounded-[1.4rem] p-4">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="reminder-toggle" className="text-[10px] font-black uppercase tracking-[0.22em] text-white">Auto reminders</Label>
                  <Switch id="reminder-toggle" checked={remindersEnabled} onCheckedChange={toggleReminders} className="data-[state=checked]:bg-emerald-500" />
                </div>
                <p className="mt-3 text-xs font-semibold text-white/70">
                  {remindersEnabled ? 'Automatic parent reminders are enabled.' : 'Manual reminders only.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          <MetricCard icon={CheckCircle2} label="Completed" value={`${stats.completed}/${stats.total}`} tone="emerald" />
          <MetricCard icon={BellRing} label="Overdue" value={String(stats.overdue)} tone="amber" />
          <MetricCard icon={Sparkles} label="Pending" value={String(stats.pending)} tone="indigo" />
          <MetricCard icon={Info} label="Age basis" value={useCorrectedAge ? 'Corrected' : 'Chronological'} tone="slate" />
        </div>
      </section>

      <section className="space-y-4">
        {schedule.map((item) => (
          <div key={item.id} className={`metric-card rounded-[1.75rem] p-0 transition-all ${item.isDone ? 'opacity-80' : ''}`}>
            <div className="grid gap-0 lg:grid-cols-[190px_minmax(0,1fr)_220px]">
              <div className={`flex flex-col items-center justify-center rounded-l-[1.75rem] px-6 py-6 text-center ${item.isDone ? 'bg-emerald-50 dark:bg-emerald-950/20' : item.isOverdue ? 'bg-rose-50 dark:bg-rose-950/20' : item.isUpcoming ? 'bg-amber-50 dark:bg-amber-950/20' : 'bg-muted/70'}`}>
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Target date</div>
                <div className="mt-2 text-3xl font-black tracking-tight text-foreground">{format(item.dueDate, 'MMM dd')}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">{format(item.dueDate, 'yyyy')}</div>
                {!item.isDone && (item.isOverdue || item.isUpcoming) && (
                  <Button variant="ghost" size="icon" onClick={() => sendManualReminder(item)} className="mt-4 rounded-xl text-indigo-600 hover:bg-white dark:hover:bg-background">
                    <BellRing className={`h-5 w-5 ${item.isOverdue ? 'animate-bounce' : ''}`} />
                  </Button>
                )}
              </div>

              <div className="px-5 py-6 sm:px-6">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-xl font-black tracking-tight text-foreground">{item.label}</h4>
                  {item.isDone && <Badge className="border-none bg-emerald-100 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Completed</Badge>}
                  {item.isOverdue && <Badge className="border-none bg-rose-100 text-[10px] font-black uppercase tracking-[0.2em] text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">Overdue</Badge>}
                  {item.isUpcoming && <Badge className="border-none bg-amber-100 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">Due soon</Badge>}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {item.vaccines.map((vaccine) => (
                    <Badge key={vaccine} className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300">
                      {vaccine}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-5 py-6 sm:px-6 lg:justify-end">
                <div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 ${item.isDone ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/10' : 'border-border bg-muted/70'}`}>
                  <Checkbox
                    id={item.id}
                    checked={item.isDone}
                    onCheckedChange={() => toggleVaccine(item.id)}
                    className="h-6 w-6 rounded-lg border-2 border-border data-[state=checked]:border-none data-[state=checked]:bg-emerald-500"
                  />
                  <label htmlFor={item.id} className="cursor-pointer text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                    {item.isDone ? 'Recorded' : 'Mark done'}
                  </label>
                </div>
                <div className="hidden rounded-full bg-muted p-2 text-muted-foreground lg:flex">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="glass-panel rounded-[1.75rem] p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-foreground">Export vaccination summary</h3>
            <p className="mt-2 max-w-xl text-sm font-medium text-muted-foreground">
              Generate a simple hospital-facing summary including completed doses, overdue vaccines, and the current schedule basis.
            </p>
          </div>
          <Button onClick={exportReport} className="h-12 rounded-2xl bg-indigo-600 px-6 text-[11px] font-black uppercase tracking-[0.22em] text-white hover:bg-indigo-700">
            <Download className="mr-2 h-4 w-4" />
            Download report
          </Button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  tone: 'emerald' | 'amber' | 'indigo' | 'slate';
}) {
  const tones = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };

  return (
    <div className="metric-card rounded-[1.5rem] p-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-black tracking-tight text-foreground">{value}</div>
    </div>
  );
}
