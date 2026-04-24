import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Milestone,
  Utensils,
  Activity,
  Plus,
  ChevronRight,
  LayoutDashboard,
  Footprints,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  MessageCircleMore,
  ExternalLink,
  TriangleAlert,
  CircleDashed,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { format } from 'date-fns';
import { safeFormat } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { motion } from 'motion/react';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';

type ModuleTint = 'blue' | 'indigo' | 'orange' | 'violet' | 'emerald' | 'amber' | 'rose';

const TRACKING_MODULES: Array<{
  id: string;
  label: string;
  icon: any;
  tint: Exclude<ModuleTint, 'amber' | 'rose'>;
}> = [
  { id: 'all', label: 'Overall', icon: LayoutDashboard, tint: 'indigo' },
  { id: 'General', label: 'Pediatric', icon: Milestone, tint: 'blue' },
  { id: 'SLP', label: 'Speech/Feeding', icon: Utensils, tint: 'orange' },
  { id: 'OT', label: 'Occupational', icon: Activity, tint: 'emerald' },
  { id: 'PT', label: 'Physiotherapy', icon: Footprints, tint: 'violet' },
];

const CDC_SPEECH_LANGUAGE_CHART = [
  {
    ageKey: '2m',
    ageLabel: '2 months',
    months: 2,
    milestones: [
      'Makes sounds other than crying',
      'Reacts to loud sounds',
    ],
  },
  {
    ageKey: '4m',
    ageLabel: '4 months',
    months: 4,
    milestones: [
      'Makes sounds like "oooo" and "aahh"',
      'Makes sounds back when talked to',
      'Turns head toward the sound of your voice',
    ],
  },
  {
    ageKey: '6m',
    ageLabel: '6 months',
    months: 6,
    milestones: [
      'Takes turns making sounds with you',
      'Blows raspberries',
      'Makes squealing noises',
    ],
  },
  {
    ageKey: '9m',
    ageLabel: '9 months',
    months: 9,
    milestones: [
      'Makes many different sounds like "mamamama" and "bababababa"',
      'Lifts arms up to be picked up',
    ],
  },
  {
    ageKey: '12m',
    ageLabel: '1 year',
    months: 12,
    milestones: [
      'Waves "bye-bye"',
      'Calls a parent "mama" or "dada" or another special name',
      'Understands "no"',
    ],
  },
  {
    ageKey: '15m',
    ageLabel: '15 months',
    months: 15,
    milestones: [
      'Tries to say one or two words besides "mama" or "dada"',
      'Looks at a familiar object when you name it',
      'Follows directions given with both a gesture and words',
      'Points to ask for something or to get help',
    ],
  },
  {
    ageKey: '18m',
    ageLabel: '18 months',
    months: 18,
    milestones: [
      'Tries to say three or more words besides "mama" or "dada"',
      'Follows one-step directions without any gestures',
    ],
  },
  {
    ageKey: '24m',
    ageLabel: '2 years',
    months: 24,
    milestones: [
      'Points to things in a book when you ask',
      'Says at least two words together, like "more milk"',
      'Points to at least two body parts when you ask',
      'Uses more gestures than just waving and pointing',
    ],
  },
] as const;

function getChronologicalAgeWeeks(date: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24 * 7)));
}

function getCorrectedAgeMonths(baby: any) {
  const chronologicalWeeks = baby?.dob ? getChronologicalAgeWeeks(baby.dob) : 0;
  const correctedWeeks = Math.max(0, chronologicalWeeks - (40 - (baby?.gestationalAgeAtBirth ?? 40)));
  return correctedWeeks / 4.345;
}

export default function DevelopmentalModule({ baby }: { baby: any }) {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [speechChecks, setSpeechChecks] = useState<Record<string, boolean>>({});
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeModule, setActiveModule] = useState('all');
  const [formData, setFormData] = useState({
    module: 'General',
    category: 'Motor',
    skill: '',
    status: 'Achieved',
    dateObserved: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  useEffect(() => {
    const q = query(collection(db, 'babies', baby.id, 'milestones'), orderBy('dateObserved', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMilestones(snapshot.docs.map((record) => ({ id: record.id, ...record.data() })));
    });
    return unsubscribe;
  }, [baby.id]);

  useEffect(() => {
    const q = collection(db, 'babies', baby.id, 'speechLanguageChecks');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const next: Record<string, boolean> = {};
      snapshot.docs.forEach((record) => {
        next[record.id] = !!record.data().checked;
      });
      setSpeechChecks(next);
    });
    return unsubscribe;
  }, [baby.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'babies', baby.id, 'milestones'), {
        ...formData,
        recordedAt: serverTimestamp(),
      });
      setIsAddOpen(false);
      setFormData({ ...formData, skill: '', notes: '', dateObserved: format(new Date(), 'yyyy-MM-dd') });
      toast.success('Milestone saved');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save milestone');
    }
  };

  const toggleSpeechCheck = async (ageKey: string, index: number, checked: boolean) => {
    const itemId = `${ageKey}__${index}`;
    const itemRef = doc(db, 'babies', baby.id, 'speechLanguageChecks', itemId);

    try {
      if (checked) {
        await setDoc(itemRef, {
          checked: true,
          ageKey,
          itemIndex: index,
          recordedAt: serverTimestamp(),
        });
      } else {
        await deleteDoc(itemRef);
      }
    } catch (error) {
      console.error(error);
      toast.error('Unable to update CDC checklist item');
    }
  };

  const filteredMilestones = useMemo(() => {
    if (activeModule === 'all') return milestones;
    return milestones.filter((milestone) => milestone.module === activeModule);
  }, [milestones, activeModule]);

  const stats = useMemo(() => {
    return TRACKING_MODULES.filter((module) => module.id !== 'all').map((module) => {
      const moduleMilestones = milestones.filter((entry) => entry.module === module.id);
      const total = moduleMilestones.length;
      const achieved = moduleMilestones.filter((entry) => entry.status === 'Achieved').length;
      const emerging = moduleMilestones.filter((entry) => entry.status === 'Emerging').length;
      const percent = total > 0 ? Math.round(((achieved + emerging * 0.5) / total) * 100) : 0;
      return { ...module, total, achieved, emerging, percent };
    });
  }, [milestones]);

  const totalAchieved = milestones.filter((entry) => entry.status === 'Achieved').length;
  const totalEmerging = milestones.filter((entry) => entry.status === 'Emerging').length;
  const overallPercent = milestones.length > 0 ? Math.round(((totalAchieved + totalEmerging * 0.5) / milestones.length) * 100) : 0;

  const correctedAgeMonths = getCorrectedAgeMonths(baby);

  const cdcSummary = useMemo(() => {
    const chartRows = CDC_SPEECH_LANGUAGE_CHART.map((group) => {
      const checkedCount = group.milestones.filter((_, index) => speechChecks[`${group.ageKey}__${index}`]).length;
      const total = group.milestones.length;
      return {
        ...group,
        checkedCount,
        total,
        percent: total ? Math.round((checkedCount / total) * 100) : 0,
        due: correctedAgeMonths >= group.months,
      };
    });

    const dueRows = chartRows.filter((row) => row.due);
    const currentRow = [...chartRows].reverse().find((row) => correctedAgeMonths >= row.months) ?? chartRows[0];
    const dueChecked = dueRows.reduce((sum, row) => sum + row.checkedCount, 0);
    const dueTotal = dueRows.reduce((sum, row) => sum + row.total, 0);
    const duePercent = dueTotal ? Math.round((dueChecked / dueTotal) * 100) : 0;
    const currentPercent = currentRow?.percent ?? 0;

    let status: 'on-track' | 'monitor' | 'review' | 'early' = 'early';
    let title = 'Early observation phase';
    let note = 'Use corrected age in preterm follow-up and keep logging communication behaviors over time.';

    if (dueTotal > 0) {
      if (currentPercent >= 85 || duePercent >= 85) {
        status = 'on-track';
        title = 'On track for recorded CDC communication milestones';
        note = `Most due CDC speech-language items up to ${currentRow.ageLabel} are marked achieved. Continue routine surveillance.`;
      } else if (currentPercent >= 50 || duePercent >= 60) {
        status = 'monitor';
        title = 'Monitor communication progress closely';
        note = `Some milestones are present, but several due items up to ${currentRow.ageLabel} remain unchecked. Review in follow-up and reinforce caregiver coaching.`;
      } else {
        status = 'review';
        title = 'Needs developmental review';
        note = `Many due CDC communication items up to ${currentRow.ageLabel} are not yet checked. Consider clinician review, screening, or referral if concerns persist.`;
      }
    }

    return {
      chartRows,
      dueRows,
      dueChecked,
      dueTotal,
      duePercent,
      currentRow,
      status,
      title,
      note,
    };
  }, [correctedAgeMonths, speechChecks]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.9fr)]">
        <div className="glass-panel rounded-[1.75rem] p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <Badge className="w-fit border-none bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                Development chart
              </Badge>
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-amber-100 text-amber-700 shadow-inner dark:bg-amber-950/30 dark:text-amber-300">
                  <BrainCircuit className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Milestones and CDC speech-language follow-up</h2>
                  <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-muted-foreground">
                    Review therapy progress by specialty, then work through the CDC communication checklist with corrected age in mind for premature infants.
                  </p>
                </div>
              </div>
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger
                nativeButton={false}
                render={
                  <Button className="h-12 rounded-2xl bg-cyan-700 px-5 text-[11px] font-black uppercase tracking-[0.22em] text-white shadow-lg shadow-cyan-500/20 hover:bg-cyan-800">
                    <Plus className="mr-2 h-4 w-4" />
                    Log interaction
                  </Button>
                }
              />
              <DialogContent className="max-w-md rounded-[2rem] border-none bg-background">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black tracking-tight text-foreground">Record clinical interaction</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Specialty">
                      <Select value={formData.module} onValueChange={(v) => setFormData({ ...formData, module: v })}>
                        <SelectTrigger className="h-11 rounded-xl border-border bg-muted"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General">Pediatrician (General)</SelectItem>
                          <SelectItem value="SLP">Speech (SLP)</SelectItem>
                          <SelectItem value="OT">Occupational (OT)</SelectItem>
                          <SelectItem value="PT">Physical (PT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Progress">
                      <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                        <SelectTrigger className="h-11 rounded-xl border-border bg-muted"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Achieved">Mastered / Achieved</SelectItem>
                          <SelectItem value="Emerging">Developing / Emerging</SelectItem>
                          <SelectItem value="Not Yet">Not Yet / Planned</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <Field label="Skill / Observation">
                    <Input value={formData.skill} onChange={(e) => setFormData({ ...formData, skill: e.target.value })} required placeholder="Head control, social smile, feeding readiness..." className="h-11 rounded-xl border-border bg-muted" />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Therapy Domain">
                      <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required placeholder="Fine motor, feeding" className="h-11 rounded-xl border-border bg-muted" />
                    </Field>
                    <Field label="Clinical Date">
                      <Input type="date" value={formData.dateObserved} onChange={(e) => setFormData({ ...formData, dateObserved: e.target.value })} required className="h-11 rounded-xl border-border bg-muted" />
                    </Field>
                  </div>

                  <Field label="Therapist Notes">
                    <Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Detailed observations..." className="h-11 rounded-xl border-border bg-muted" />
                  </Field>

                  <Button type="submit" className="mt-2 h-12 w-full rounded-2xl bg-cyan-700 text-sm font-black uppercase tracking-[0.22em] text-white hover:bg-cyan-800">
                    Save record
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-3">
          <OverviewCard icon={LayoutDashboard} label="Global mastery" value={`${overallPercent}%`} helper={`${milestones.length} total entries`} tint="indigo" />
          <OverviewCard icon={CheckCircle2} label="Achieved" value={String(totalAchieved)} helper="Completed items" tint="emerald" />
          <OverviewCard icon={Clock3} label="Emerging" value={String(totalEmerging)} helper="Developing items" tint="amber" />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="glass-panel rounded-[1.75rem] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <Badge className="w-fit border-none bg-orange-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                CDC speech & language
              </Badge>
              <h3 className="text-2xl font-black tracking-tight text-foreground">Communication milestone chart</h3>
              <p className="max-w-2xl text-sm font-medium leading-6 text-muted-foreground">
                This checklist uses CDC Learn the Signs. Act Early communication milestones and applies corrected age for this follow-up view.
              </p>
            </div>
            <a
              href="https://www.cdc.gov/milestones"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-[11px] font-black uppercase tracking-[0.22em] text-foreground transition-colors hover:bg-muted"
            >
              CDC reference
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {cdcSummary.chartRows.map((group) => (
              <div key={group.ageKey} className={`rounded-[1.45rem] border p-4 ${group.due ? 'border-cyan-200 bg-cyan-50/50 dark:border-cyan-950/40 dark:bg-cyan-950/10' : 'border-border/60 bg-background/75 dark:bg-slate-900/30'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">{group.ageLabel}</div>
                    <div className="mt-1 text-lg font-black tracking-tight text-foreground">{group.checkedCount}/{group.total} checked</div>
                  </div>
                  <Badge className={`border-none px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${group.due ? 'bg-cyan-700 text-white dark:bg-cyan-500 dark:text-slate-950' : 'bg-muted text-muted-foreground'}`}>
                    {group.due ? 'Due now' : 'Upcoming'}
                  </Badge>
                </div>

                <div className="mt-4 space-y-3">
                  {group.milestones.map((item, index) => {
                    const checked = !!speechChecks[`${group.ageKey}__${index}`];
                    return (
                      <label key={`${group.ageKey}-${index}`} className="flex cursor-pointer items-start gap-3 rounded-[1rem] border border-border/50 bg-white/70 px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-white dark:bg-slate-950/30 dark:hover:bg-slate-950/50">
                        <Checkbox checked={checked} onCheckedChange={(next) => toggleSpeechCheck(group.ageKey, index, !!next)} className="mt-0.5" />
                        <span className="leading-6">{item}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Card className="metric-card rounded-[1.75rem] border-none p-0">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-[1rem] ${interpretationTone(cdcSummary.status)}`}>
                  {cdcSummary.status === 'on-track' ? <CheckCircle2 className="h-5 w-5" /> : cdcSummary.status === 'monitor' ? <CircleDashed className="h-5 w-5" /> : cdcSummary.status === 'review' ? <TriangleAlert className="h-5 w-5" /> : <MessageCircleMore className="h-5 w-5" />}
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Interpretation</div>
                  <h3 className="mt-1 text-xl font-black tracking-tight text-foreground">{cdcSummary.title}</h3>
                </div>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{cdcSummary.note}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <MiniSummaryCard label="Corrected age" value={`${correctedAgeMonths.toFixed(1)} mo`} helper="Used for CDC checklist view" />
                <MiniSummaryCard label="Due items checked" value={`${cdcSummary.dueChecked}/${cdcSummary.dueTotal || 0}`} helper={cdcSummary.dueTotal ? `${cdcSummary.duePercent}% complete` : 'No due age band yet'} />
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card rounded-[1.75rem] border-none p-0">
            <CardContent className="space-y-3 p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Clinical note</div>
              <p className="text-sm leading-6 text-muted-foreground">
                CDC milestone checklists support surveillance only and do not replace standardized developmental screening tools or specialist assessment.
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                CDC source used for this chart: the 2026 CDC Learn the Signs. Act Early milestone pages for 2 months, 4 months, 6 months, 9 months, 1 year, 15 months, 18 months, and 2 years.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="glass-panel rounded-[1.75rem] p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[repeat(5,minmax(0,1fr))]">
          <button
            onClick={() => setActiveModule('all')}
            className={`metric-card rounded-[1.35rem] p-4 text-left transition-all ${activeModule === 'all' ? 'ring-2 ring-cyan-500/20' : 'hover:-translate-y-0.5'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <span className="text-lg font-black tracking-tight text-foreground">{overallPercent}%</span>
            </div>
            <div className="mt-4 text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">Overall</div>
            <div className="mt-1 text-xs font-semibold text-muted-foreground">{milestones.length} interactions</div>
          </button>

          {stats.map((stat) => (
            <button
              key={stat.id}
              onClick={() => setActiveModule(stat.id)}
              className={`metric-card rounded-[1.35rem] p-4 text-left transition-all ${activeModule === stat.id ? 'ring-2 ring-cyan-500/20' : 'hover:-translate-y-0.5'}`}
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses(stat.tint)}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <span className="text-lg font-black tracking-tight text-foreground">{stat.percent}%</span>
              </div>
              <div className="mt-4 text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">{stat.label}</div>
              <div className="mt-1 text-xs font-semibold text-muted-foreground">{stat.achieved}/{stat.total} achieved</div>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {TRACKING_MODULES.map((module) => {
            const count = module.id === 'all' ? milestones.length : milestones.filter((entry) => entry.module === module.id).length;
            return (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] transition-all ${activeModule === module.id ? 'bg-cyan-700 text-white shadow-lg shadow-cyan-500/15' : 'bg-muted text-muted-foreground hover:bg-card hover:text-foreground'}`}
              >
                {module.label} <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
        <Badge className="w-fit border-none bg-muted px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
          {filteredMilestones.length} visible entries
        </Badge>
      </section>

      <section className="space-y-4">
        {filteredMilestones.map((milestone) => {
          const progress = milestone.status === 'Achieved' ? 100 : milestone.status === 'Emerging' ? 50 : 10;
          return (
            <Card key={milestone.id} className="metric-card rounded-[1.75rem] border-none p-0">
              <CardContent className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
                <div className={`flex h-14 w-14 items-center justify-center rounded-[1.25rem] ${toneClasses(moduleTint(milestone.module))}`}>
                  {milestone.module === 'SLP' ? <Utensils className="h-6 w-6" /> : milestone.module === 'OT' ? <Activity className="h-6 w-6" /> : milestone.module === 'PT' ? <Footprints className="h-6 w-6" /> : <Milestone className="h-6 w-6" />}
                </div>

                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">{milestone.category}</span>
                    <Badge className={`border-none px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${statusTone(milestone.status)}`}>
                      {milestone.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-black tracking-tight text-foreground">{milestone.skill}</CardTitle>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-muted-foreground">
                    <span>{safeFormat(milestone.dateObserved, 'MMMM dd, yyyy')}</span>
                    <span>{milestone.module} therapist</span>
                  </div>
                  {milestone.notes && (
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{milestone.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-4 lg:justify-end">
                  <ProgressDial value={progress} tone={moduleTint(milestone.module)} />
                  <div className="hidden rounded-full bg-muted p-2 text-muted-foreground lg:flex">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredMilestones.length === 0 && (
          <div className="rounded-[1.75rem] border border-dashed border-border bg-background/70 px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
              <Milestone className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-xl font-black tracking-tight text-foreground">No milestone entries yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm font-medium text-muted-foreground">
              Start with a therapy or developmental observation to populate this chart and make progress visible over time.
            </p>
            <Button variant="outline" className="mt-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.22em]" onClick={() => setIsAddOpen(true)}>
              Add first record
            </Button>
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

function OverviewCard({
  icon: Icon,
  label,
  value,
  helper,
  tint,
}: {
  icon: any;
  label: string;
  value: string;
  helper: string;
  tint: 'indigo' | 'emerald' | 'amber';
}) {
  return (
    <div className="metric-card rounded-[1.5rem] p-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses(tint)}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-black tracking-tight text-foreground">{value}</div>
      <div className="mt-1 text-xs font-semibold text-muted-foreground">{helper}</div>
    </div>
  );
}

function MiniSummaryCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-[1.2rem] border border-border/60 bg-background/75 p-4 dark:bg-slate-900/40">
      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-black tracking-tight text-foreground">{value}</div>
      <div className="mt-1 text-xs font-semibold text-muted-foreground">{helper}</div>
    </div>
  );
}

function ProgressDial({ value, tone }: { value: number; tone: Exclude<ModuleTint, 'amber' | 'rose'> }) {
  const stroke = 251.2;
  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <svg className="-rotate-90 h-full w-full" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted/40" />
        <motion.circle
          cx="50"
          cy="50"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={stroke}
          initial={{ strokeDashoffset: stroke }}
          animate={{ strokeDashoffset: stroke - (stroke * value) / 100 }}
          className={progressTone(tone)}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute text-[11px] font-black uppercase tracking-[0.12em] text-foreground">{value}%</span>
    </div>
  );
}

function toneClasses(tint: ModuleTint) {
  const map = {
    indigo: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300',
  };
  return map[tint];
}

function statusTone(status: string) {
  if (status === 'Achieved') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
  if (status === 'Emerging') return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
  return 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
}

function moduleTint(module: string): Exclude<ModuleTint, 'amber' | 'rose'> {
  if (module === 'SLP') return 'orange';
  if (module === 'OT') return 'emerald';
  if (module === 'PT') return 'violet';
  if (module === 'General') return 'blue';
  return 'indigo';
}

function progressTone(tint: Exclude<ModuleTint, 'amber' | 'rose'>) {
  const map = {
    indigo: 'text-cyan-600',
    blue: 'text-blue-500',
    orange: 'text-orange-500',
    emerald: 'text-emerald-500',
    violet: 'text-violet-500',
  };
  return map[tint];
}

function interpretationTone(status: 'on-track' | 'monitor' | 'review' | 'early') {
  if (status === 'on-track') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300';
  if (status === 'monitor') return 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300';
  if (status === 'review') return 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300';
  return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300';
}
