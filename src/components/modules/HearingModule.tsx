import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Ear, CheckCircle2, AlertCircle, Plus, PhoneCall, AudioWaveform, ClipboardList } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { safeFormat } from '../../lib/utils';

const REFLEX_KEYS = ['moro', 'rooting', 'babinski', 'palmar', 'plantar'] as const;

export default function HearingModule({ baby }: { baby: any }) {
  const [screenings, setScreenings] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    testType: 'TEOAE',
    round: '1st Screening',
    date: format(new Date(), 'yyyy-MM-dd'),
    resultLeft: 'Pass',
    resultRight: 'Pass',
    reflexes: {
      moro: 'Normal',
      rooting: 'Normal',
      babinski: 'Normal',
      palmar: 'Normal',
      plantar: 'Normal',
    },
    entFindings: '',
    overallResult: 'Pass',
    followUpType: 'Not applicable',
    notes: '',
  });

  useEffect(() => {
    const q = query(collection(db, 'babies', baby.id, 'hearing'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setScreenings(snapshot.docs.map((record) => ({ id: record.id, ...record.data() })));
      },
      (error) => {
        console.error('Firestore listening error:', error);
      }
    );
    return unsubscribe;
  }, [baby.id]);

  const passCount = screenings.filter((record) => record.resultLeft === 'Pass' && record.resultRight === 'Pass').length;
  const needsReviewCount = screenings.length - passCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const overallResult = formData.resultLeft === 'Pass' && formData.resultRight === 'Pass' ? 'Pass' : 'Review';
      await addDoc(collection(db, 'babies', baby.id, 'hearing'), {
        ...formData,
        overallResult,
        timestamp: serverTimestamp(),
      });
      setIsAddOpen(false);
      setFormData({
        testType: 'TEOAE',
        round: '1st Screening',
        date: format(new Date(), 'yyyy-MM-dd'),
        resultLeft: 'Pass',
        resultRight: 'Pass',
        reflexes: { moro: 'Normal', rooting: 'Normal', babinski: 'Normal', palmar: 'Normal', plantar: 'Normal' },
        entFindings: '',
        overallResult: 'Pass',
        followUpType: 'Not applicable',
        notes: '',
      });
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  return (
    <div className="space-y-6 text-foreground">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="glass-panel rounded-[1.75rem] p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-sky-100 text-sky-700 shadow-inner dark:bg-sky-950/30 dark:text-sky-300">
                <Ear className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <Badge className="w-fit border-none bg-sky-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                  Audiology module
                </Badge>
                <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Hearing screening overview</h2>
                <p className="max-w-2xl text-sm font-medium leading-6 text-muted-foreground">
                  Capture bilateral screening results, reflex status, ENT findings, and follow-up actions in a cleaner clinic-ready layout.
                </p>
              </div>
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger
                nativeButton={false}
                render={
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 text-[11px] font-black uppercase tracking-[0.22em] text-white shadow-lg shadow-sky-500/20 transition-colors hover:bg-sky-700"
                  >
                    <Plus className="h-4 w-4" />
                    New screening
                  </motion.button>
                }
              />
              <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[2rem] border-none bg-background sm:max-w-[760px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black tracking-tight text-foreground">New screening record</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-2 text-foreground">
                  <div className="grid gap-4 rounded-[1.5rem] bg-muted/70 p-4 md:grid-cols-3">
                    <Field label="Test Type">
                      <Select value={formData.testType} onValueChange={(v) => setFormData({ ...formData, testType: v })}>
                        <SelectTrigger className="rounded-xl border-border bg-card"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-card">
                          <SelectItem value="TEOAE">TEOAE</SelectItem>
                          <SelectItem value="DPOAE">DPOAE</SelectItem>
                          <SelectItem value="ABR">ABR</SelectItem>
                          <SelectItem value="BOA">BOA</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Round">
                      <Select value={formData.round} onValueChange={(v) => setFormData({ ...formData, round: v })}>
                        <SelectTrigger className="rounded-xl border-border bg-card"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-card">
                          <SelectItem value="1st Screening">1st Screening</SelectItem>
                          <SelectItem value="2nd Screening">2nd Screening</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Date">
                      <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required className="rounded-xl border-border bg-card" />
                    </Field>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <EarResultField
                      title="Left Ear"
                      value={formData.resultLeft}
                      onChange={(value) => setFormData({ ...formData, resultLeft: value })}
                    />
                    <EarResultField
                      title="Right Ear"
                      value={formData.resultRight}
                      onChange={(value) => setFormData({ ...formData, resultRight: value })}
                    />
                  </div>

                  <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/60 p-4 dark:border-emerald-950/40 dark:bg-emerald-950/10">
                    <div className="mb-4 flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                      <h4 className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">Newborn reflexes</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      {REFLEX_KEYS.map((key) => (
                        <div key={key} className="space-y-1.5">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{key}</Label>
                          <Select
                            value={formData.reflexes[key]}
                            onValueChange={(v) => setFormData({ ...formData, reflexes: { ...formData.reflexes, [key]: v } })}
                          >
                            <SelectTrigger className="h-9 rounded-xl border-white/60 bg-white text-xs dark:border-slate-700 dark:bg-slate-900">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Normal">Normal</SelectItem>
                              <SelectItem value="Abnormal">Abnormal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="ENT Findings">
                      <Input value={formData.entFindings} onChange={(e) => setFormData({ ...formData, entFindings: e.target.value })} placeholder="ENT observations..." className="rounded-xl border-border bg-card" />
                    </Field>
                    <Field label="Follow-up Type">
                      <Select value={formData.followUpType} onValueChange={(v) => setFormData({ ...formData, followUpType: v })}>
                        <SelectTrigger className="rounded-xl border-border bg-card"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Phone follow up">Phone follow up</SelectItem>
                          <SelectItem value="Regular follow up">Regular follow up</SelectItem>
                          <SelectItem value="Not applicable">Not applicable</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <Field label="Clinical Notes">
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional remarks..."
                      className="min-h-[96px] w-full rounded-xl border border-border bg-card p-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-950/40"
                    />
                  </Field>

                  <Button type="submit" className="h-12 w-full rounded-2xl bg-sky-600 text-sm font-black uppercase tracking-[0.22em] text-white hover:bg-sky-700">
                    Save screening record
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <MetricCard icon={AudioWaveform} label="Total screenings" value={String(screenings.length)} tone="sky" />
          <MetricCard icon={CheckCircle2} label="Bilateral pass" value={String(passCount)} tone="emerald" />
          <MetricCard icon={PhoneCall} label="Needs review" value={String(needsReviewCount)} tone="amber" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {screenings.map((screening) => (
          <Card key={screening.id} className="metric-card rounded-[1.75rem] border-none p-0">
            <CardHeader className="border-b border-border/60 px-5 pb-4 pt-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-none bg-sky-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                      {screening.round}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      {screening.testType}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-black tracking-tight text-foreground">{safeFormat(screening.date, 'MMMM dd, yyyy')}</CardTitle>
                </div>

                <div className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] ${screening.resultLeft === 'Pass' && screening.resultRight === 'Pass' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                  <Ear className="h-4 w-4" />
                  {screening.resultLeft === 'Pass' && screening.resultRight === 'Pass' ? 'Pass' : 'Review'}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 px-5 py-5 sm:px-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <ResultItem label="Left ear" result={screening.resultLeft} />
                <ResultItem label="Right ear" result={screening.resultRight} />
              </div>

              {screening.reflexes && (
                <div className="rounded-[1.35rem] bg-muted/60 p-4">
                  <h4 className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Reflex profile</h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(screening.reflexes).map(([name, value]: [string, any]) => (
                      <div key={name} className="flex items-center justify-between rounded-xl border border-border/50 bg-background/70 px-3 py-2 dark:bg-slate-900/40">
                        <span className="text-xs font-bold capitalize text-muted-foreground">{name}</span>
                        <span className={`text-xs font-black uppercase tracking-[0.16em] ${value === 'Normal' ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(180px,0.45fr)]">
                <div className="space-y-4">
                  {screening.entFindings && (
                    <InfoBlock title="ENT findings" value={screening.entFindings} />
                  )}
                  {screening.notes && (
                    <InfoBlock title="Clinical notes" value={screening.notes} />
                  )}
                </div>
                <div className="rounded-[1.35rem] border border-border/60 bg-background/70 p-4 dark:bg-slate-900/40">
                  <div className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Follow-up</div>
                  <div className="mt-2 text-sm font-black text-sky-700 dark:text-sky-300">{screening.followUpType}</div>
                  <div className="mt-4 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Protocol</div>
                  <div className="mt-2 inline-flex rounded-full bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white dark:bg-white dark:text-slate-950">
                    Clinical protocol
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {screenings.length === 0 && (
          <div className="col-span-full rounded-[1.75rem] border border-dashed border-border bg-background/70 px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300">
              <Ear className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-xl font-black tracking-tight text-foreground">No hearing screenings yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm font-medium text-muted-foreground">
              Start the first hearing record to track screening results and future follow-up actions.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-black uppercase tracking-[0.2em] text-foreground">{label}</Label>
      {children}
    </div>
  );
}

function EarResultField({
  title,
  value,
  onChange,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-sky-100 bg-sky-50/60 p-4 dark:border-sky-950/40 dark:bg-sky-950/10">
      <h4 className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">{title}</h4>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="rounded-xl border-white/60 bg-white dark:border-slate-700 dark:bg-slate-900"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="Pass">Pass</SelectItem>
          <SelectItem value="Refer">Refer</SelectItem>
          <SelectItem value="Noisy">Noisy</SelectItem>
          <SelectItem value="CNT">CNT</SelectItem>
          <SelectItem value="NOT DONE">Not done</SelectItem>
        </SelectContent>
      </Select>
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
  tone: 'sky' | 'emerald' | 'amber';
}) {
  const tones = {
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
  };

  return (
    <div className="metric-card rounded-[1.5rem] p-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-black tracking-tight text-foreground">{value}</div>
    </div>
  );
}

function ResultItem({ label, result }: { label: string; result: string }) {
  const isPass = result === 'Pass';
  return (
    <div className="rounded-[1.25rem] border border-border/60 bg-background/80 p-4 dark:bg-slate-900/40">
      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
      <div className={`mt-2 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] ${isPass ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'}`}>
        {isPass ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        {result}
      </div>
    </div>
  );
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-foreground">{value}</p>
    </div>
  );
}
