import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, onSnapshot, deleteDoc, collection, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  ArrowLeft,
  Eye,
  Ear,
  Brain,
  Ruler,
  Shield,
  ClipboardCheck,
  Milestone,
  AlertCircle,
  Sparkles,
  CalendarDays,
  Weight,
  ActivitySquare,
  Printer,
  ArrowUpRight,
  Stethoscope,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { printComprehensiveReport } from '../lib/reporting';
import { safeFormat } from '../lib/utils';

import GrowthModule from '../components/modules/GrowthModule';
import HearingModule from '../components/modules/HearingModule';
import EyeModule from '../components/modules/EyeModule';
import DevelopmentalModule from '../components/modules/DevelopmentalModule';
import MentalHealthModule from '../components/modules/MentalHealthModule';
import VaccinationModule from '../components/modules/VaccinationModule';
import CareCoordination from '../components/modules/CareCoordination';
import AISummaryCard from '../components/modules/AISummaryCard';

const TAB_ITEMS = [
  { value: 'growth', label: 'Growth', shortLabel: 'Growth', icon: Ruler, shell: 'from-cyan-500/12 via-sky-500/10 to-transparent' },
  { value: 'hearing', label: 'Hearing', shortLabel: 'Hearing', icon: Ear, shell: 'from-sky-500/12 via-teal-500/10 to-transparent' },
  { value: 'eyes', label: 'Eye Screening', shortLabel: 'Eyes', icon: Eye, shell: 'from-emerald-500/12 via-cyan-500/10 to-transparent' },
  { value: 'milestones', label: 'Development', shortLabel: 'Development', icon: Milestone, shell: 'from-amber-500/12 via-orange-500/10 to-transparent' },
  { value: 'coordination', label: 'Care Settings', shortLabel: 'Care', icon: ClipboardCheck, shell: 'from-slate-500/12 via-slate-400/8 to-transparent' },
  { value: 'mental', label: 'Well-being', shortLabel: 'Well-being', icon: Brain, shell: 'from-rose-500/12 via-orange-500/10 to-transparent' },
  { value: 'vaccine', label: 'Vaccines', shortLabel: 'Vaccines', icon: Shield, shell: 'from-teal-500/12 via-cyan-500/10 to-transparent' },
  { value: 'settings', label: 'Profile', shortLabel: 'Profile', icon: AlertCircle, shell: 'from-rose-500/12 via-red-500/10 to-transparent' },
] as const;

const PRIMARY_TABS = ['growth', 'hearing', 'eyes', 'milestones'] as const;
const SUPPORT_TABS = ['coordination', 'mental', 'vaccine', 'settings'] as const;

function getChronologicalAgeWeeks(date: string | undefined | null) {
  if (!date) return 0;
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24 * 7)));
}

function formatReviewText(count: number, emptyLabel: string, filledLabel: string) {
  if (!count) return emptyLabel;
  return `${count} ${filledLabel}`;
}

export default function BabyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [baby, setBaby] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [hearingData, setHearingData] = useState<any[]>([]);
  const [eyeData, setEyeData] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [mentalHealthRecords, setMentalHealthRecords] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;

    const unsubBaby = onSnapshot(doc(db, 'babies', id), (snapshot) => {
      if (snapshot.exists()) {
        setBaby({ id: snapshot.id, ...snapshot.data() });
      }
      setLoading(false);
    });

    const unsubGrowth = onSnapshot(query(collection(db, 'babies', id, 'growth'), orderBy('date', 'asc')), (snapshot) => {
      setGrowthData(snapshot.docs.map((record) => ({ id: record.id, ...record.data() })));
    });

    const unsubHearing = onSnapshot(query(collection(db, 'babies', id, 'hearing'), orderBy('date', 'desc')), (snapshot) => {
      setHearingData(snapshot.docs.map((record) => ({ id: record.id, ...record.data() })));
    });

    const unsubEye = onSnapshot(query(collection(db, 'babies', id, 'eyes'), orderBy('date', 'desc')), (snapshot) => {
      setEyeData(snapshot.docs.map((record) => ({ id: record.id, ...record.data() })));
    });

    const unsubMilestone = onSnapshot(query(collection(db, 'babies', id, 'milestones'), orderBy('dateObserved', 'desc')), (snapshot) => {
      setMilestones(snapshot.docs.map((record) => ({ id: record.id, ...record.data() })));
    });

    const unsubVaccination = onSnapshot(collection(db, 'babies', id, 'vaccinations'), (snapshot) => {
      setVaccinations(snapshot.docs.map((record) => ({ id: record.id, ...record.data() })));
    });

    const unsubAppointments = onSnapshot(query(collection(db, 'babies', id, 'appointments'), orderBy('date', 'asc')), (snapshot) => {
      setAppointments(snapshot.docs.map((record) => ({ id: record.id, ...record.data() })));
    });

    const unsubMentalHealth = onSnapshot(query(collection(db, 'babies', id, 'mentalHealth'), orderBy('date', 'desc')), (snapshot) => {
      setMentalHealthRecords(snapshot.docs.map((record) => ({ id: record.id, ...record.data() })));
    });

    return () => {
      unsubBaby();
      unsubGrowth();
      unsubHearing();
      unsubEye();
      unsubMilestone();
      unsubVaccination();
      unsubAppointments();
      unsubMentalHealth();
    };
  }, [id]);

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to permanently delete this clinical profile?')) return;
    try {
      await deleteDoc(doc(db, 'babies', id));
      toast.success('Profile deleted successfully');
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete profile');
    }
  };

  const validTabs = new Set(TAB_ITEMS.map((tab) => tab.value));
  const requestedTab = searchParams.get('tab');
  const activeTab =
    requestedTab && validTabs.has(requestedTab as (typeof TAB_ITEMS)[number]['value'])
      ? requestedTab
      : 'growth';

  const setActiveTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };

  const primaryHighlights = useMemo<
    Array<{
      value: string;
      title: string;
      subtitle: string;
      summary: string;
      accent: string;
      icon: any;
      tone: 'cyan' | 'sky' | 'emerald' | 'amber';
    }>
  >(
    () => [
      {
        value: 'growth',
        title: 'Growth',
        subtitle: 'Intergrowth charts and measurements',
        summary: growthData.length
          ? `${growthData.length} recorded measurements`
          : 'Start the first growth entry',
        accent: growthData.length ? 'Tracking active' : 'Needs first entry',
        icon: Ruler,
        tone: 'cyan',
      },
      {
        value: 'hearing',
        title: 'Hearing',
        subtitle: 'Screening rounds and reflex findings',
        summary: formatReviewText(hearingData.length, 'No audiology entries yet', 'screening record(s)'),
        accent: hearingData.some((entry) => entry.resultLeft !== 'Pass' || entry.resultRight !== 'Pass')
          ? 'Review pending'
          : 'Latest status stable',
        icon: Ear,
        tone: 'sky',
      },
      {
        value: 'eyes',
        title: 'Eye Screening',
        subtitle: 'ROP reports and retinal follow-up',
        summary: formatReviewText(eyeData.length, 'No retinal reports yet', 'retinal report(s)'),
        accent: eyeData.length ? 'Ophthalmology module ready' : 'Schedule first review',
        icon: Eye,
        tone: 'emerald',
      },
      {
        value: 'milestones',
        title: 'Development',
        subtitle: 'Therapy progress and CDC speech-language chart',
        summary: formatReviewText(milestones.length, 'No milestone logs yet', 'milestone entry/entries'),
        accent: milestones.some((entry) => entry.module === 'SLP')
          ? 'Speech chart included'
          : 'Add developmental review',
        icon: Milestone,
        tone: 'amber',
      },
    ],
    [growthData.length, hearingData, eyeData.length, milestones]
  );

  if (loading) {
    return (
      <div className="hero-panel rounded-[2rem] p-10 text-center text-sm font-semibold text-muted-foreground">
        Loading baby profile...
      </div>
    );
  }

  if (!baby) {
    return (
      <div className="glass-panel rounded-[2rem] p-10 text-center text-sm font-semibold text-muted-foreground">
        Baby not found.
      </div>
    );
  }

  const currentAgeWeeks = getChronologicalAgeWeeks(baby.dob);
  const gaAtBirth = typeof baby.gestationalAgeAtBirth === 'number' ? baby.gestationalAgeAtBirth : 40;
  const correctedAgeWeeks = Math.max(0, currentAgeWeeks - (40 - gaAtBirth));
  const statusTone = baby.highRiskFactors?.length ? 'priority follow-up' : 'stable follow-up';
  const dobDisplay = safeFormat(baby.dob, 'MMM dd, yyyy', 'date unavailable');
  const gaDisplay = typeof baby.gestationalAgeAtBirth === 'number' ? `${baby.gestationalAgeAtBirth} weeks` : '—';
  const bwDisplay = baby.birthWeight ? `${baby.birthWeight} g` : '—';
  const handlePrintReport = () =>
    printComprehensiveReport({
      baby,
      growthData,
      hearingData,
      eyeData,
      milestoneData: milestones,
      vaccinationData: vaccinations,
      appointmentData: appointments,
      mentalHealthData: mentalHealthRecords,
    });

  const supportItems = TAB_ITEMS.filter((tab) =>
    SUPPORT_TABS.includes(tab.value as (typeof SUPPORT_TABS)[number])
  );
  const activeTabMeta = TAB_ITEMS.find((tab) => tab.value === activeTab) ?? TAB_ITEMS[0];

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <header className="hero-panel relative overflow-hidden rounded-[2.25rem] px-5 py-6 sm:px-8 sm:py-8">
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-white/30 blur-3xl dark:bg-cyan-300/10" />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.8fr)] lg:items-start">
          <div className="space-y-5">
            <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-cyan-700 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-cyan-300">
              <ArrowLeft className="h-4 w-4" />
              Care Hub
            </Link>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-white/85 text-4xl shadow-xl shadow-cyan-500/10 ring-1 ring-white/70 dark:bg-slate-900/80">
                <span aria-hidden="true">👶</span>
              </div>

              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">{baby.name}</h1>
                  <Badge className={`border-none px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] ${baby.highRiskFactors?.length ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
                    {statusTone}
                  </Badge>
                </div>
                <p className="max-w-2xl text-sm font-semibold text-slate-700/80 dark:text-slate-300/85">
                  Gestational age at birth {gaDisplay}, born on {dobDisplay}, birth weight {bwDisplay}.
                </p>
                <div className="flex flex-wrap gap-3 text-xs font-black uppercase tracking-[0.2em] text-slate-600/75 dark:text-slate-400">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 dark:bg-slate-900/60">
                    <CalendarDays className="h-3.5 w-3.5" /> DOB recorded
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 dark:bg-slate-900/60">
                    <Weight className="h-3.5 w-3.5" /> NICU follow-up
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 dark:bg-slate-900/60">
                    <Sparkles className="h-3.5 w-3.5" /> AI-supported review
                  </span>
                </div>
                <div className="pt-2">
                  <Button onClick={handlePrintReport} className="h-11 rounded-2xl bg-slate-950 px-5 text-[11px] font-black uppercase tracking-[0.22em] text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                    <Printer className="mr-2 h-4 w-4" />
                    Print / Save PDF Report
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <StatPill icon={ActivitySquare} label="Chronological Age" value={`${currentAgeWeeks} wk`} subtle="Since birth" />
            <StatPill icon={Sparkles} label="Corrected Age" value={`${correctedAgeWeeks} wk`} subtle="Adjusted for prematurity" accent />
            <StatPill icon={Weight} label="Care Focus" value={baby.highRiskFactors?.length ? 'High risk' : 'Stable'} subtle={baby.highRiskFactors?.length ? `${baby.highRiskFactors.length} risk factor(s)` : 'Routine surveillance'} />
          </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <section className="glass-panel rounded-[2rem] p-4 sm:p-6">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                  <Badge className="w-fit border-none bg-cyan-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
                    Clinical navigation
                  </Badge>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Priority modules at the top</h2>
                    <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-muted-foreground">
                      Growth, Hearing, Eye Screening, and Development now sit as the main workspace tabs so clinicians land on the core follow-up pathways first.
                    </p>
                  </div>
                </div>
                <div className="rounded-[1.35rem] bg-cyan-50/70 px-4 py-3 text-xs font-semibold text-cyan-900 dark:bg-cyan-950/20 dark:text-cyan-100">
                  Active workspace: <span className="font-black uppercase tracking-[0.2em]">{activeTabMeta.label}</span>
                </div>
              </div>

              <TabsList className="grid !h-auto w-full gap-3 rounded-none bg-transparent p-0 group-data-horizontal/tabs:h-auto md:grid-cols-2 xl:grid-cols-4">
                {primaryHighlights.map((item) => (
                  <ModuleQuickTab
                    key={item.value}
                    value={item.value}
                    title={item.title}
                    subtitle={item.subtitle}
                    summary={item.summary}
                    accent={item.accent}
                    icon={item.icon}
                    tone={item.tone}
                  />
                ))}
              </TabsList>

              <div className="rounded-[1.5rem] border border-border/60 bg-background/70 p-3 dark:bg-slate-900/30">
                <div className="mb-3 flex items-center gap-2 px-1 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                  <Stethoscope className="h-4 w-4" />
                  Support areas
                </div>
                <TabsList className="flex !h-auto w-full flex-wrap justify-start gap-2 rounded-none bg-transparent p-0 group-data-horizontal/tabs:h-auto">
                  {supportItems.map((tab) => (
                    <ModuleTabTrigger key={tab.value} value={tab.value} label={tab.label} shortLabel={tab.shortLabel} icon={tab.icon} />
                  ))}
                </TabsList>
              </div>
            </div>

            <div className="soft-panel rounded-[1.75rem] p-5">
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Current tab</div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300">
                      <activeTabMeta.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight text-foreground">{activeTabMeta.label}</h3>
                      <p className="text-sm font-medium text-muted-foreground">Full-screen clinical view opens below.</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  <QuickInfoCard label="Growth records" value={String(growthData.length)} helper="Charted measurements" />
                  <QuickInfoCard label="Audiology reviews" value={String(hearingData.length)} helper="Saved screening rounds" />
                  <QuickInfoCard label="Retinal reports" value={String(eyeData.length)} helper="Eye follow-up notes" />
                  <QuickInfoCard label="Development logs" value={String(milestones.length)} helper="Milestones and therapy entries" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-panel rounded-[2rem] p-4 sm:p-6">
          <AISummaryCard
            baby={baby}
            growthData={growthData}
            hearingData={hearingData}
            eyeData={eyeData}
            milestoneData={milestones}
            vaccinationData={vaccinations}
          />
        </section>

        <div>
          <TabsContent value="growth">
            <ModuleShell tone={TAB_ITEMS[0].shell}>
              <GrowthModule baby={baby} />
            </ModuleShell>
          </TabsContent>
          <TabsContent value="hearing">
            <ModuleShell tone={TAB_ITEMS[1].shell}>
              <HearingModule baby={baby} />
            </ModuleShell>
          </TabsContent>
          <TabsContent value="eyes">
            <ModuleShell tone={TAB_ITEMS[2].shell}>
              <EyeModule baby={baby} />
            </ModuleShell>
          </TabsContent>
          <TabsContent value="milestones">
            <ModuleShell tone={TAB_ITEMS[3].shell}>
              <DevelopmentalModule baby={baby} />
            </ModuleShell>
          </TabsContent>
          <TabsContent value="coordination">
            <ModuleShell tone={TAB_ITEMS[4].shell}>
              <CareCoordination baby={baby} />
            </ModuleShell>
          </TabsContent>
          <TabsContent value="mental">
            <ModuleShell tone={TAB_ITEMS[5].shell}>
              <MentalHealthModule baby={baby} />
            </ModuleShell>
          </TabsContent>
          <TabsContent value="vaccine">
            <ModuleShell tone={TAB_ITEMS[6].shell}>
              <VaccinationModule baby={baby} />
            </ModuleShell>
          </TabsContent>
          <TabsContent value="settings">
            <ModuleShell tone={TAB_ITEMS[7].shell}>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
                <div className="space-y-4">
                  <Badge className="w-fit border-none bg-rose-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                    Profile management
                  </Badge>
                  <h2 className="text-3xl font-black tracking-tight text-foreground">Administrative actions</h2>
                  <p className="max-w-xl text-sm font-medium leading-6 text-muted-foreground">
                    Update identifying details, review the registry metadata, or permanently remove the record when required.
                  </p>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-muted-foreground">Profile ID: {baby.id}</p>
                </div>

                <div className="glass-panel rounded-[1.75rem] p-4 sm:p-6">
                  <div className="grid gap-4">
                    <Button variant="outline" className="h-14 rounded-2xl border-2 text-xs font-black uppercase tracking-[0.24em]">
                      Edit Birth Particulars
                    </Button>
                    <Button
                      variant="destructive"
                      className="h-14 rounded-2xl text-xs font-black uppercase tracking-[0.24em] shadow-lg shadow-rose-500/10"
                      onClick={handleDelete}
                    >
                      Delete Clinical Profile
                    </Button>
                  </div>
                </div>
              </div>
            </ModuleShell>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  subtle,
  accent = false,
}: {
  icon: any;
  label: string;
  value: string;
  subtle: string;
  accent?: boolean;
}) {
  return (
    <div className={`metric-card rounded-[1.5rem] p-4 ${accent ? 'bg-slate-950 text-white dark:bg-cyan-500/20' : ''}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${accent ? 'bg-white/15 text-white' : 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300'}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className={`text-[11px] font-black uppercase tracking-[0.22em] ${accent ? 'text-white/70' : 'text-muted-foreground'}`}>{label}</div>
      <div className={`mt-2 text-2xl font-black tracking-tight ${accent ? 'text-white' : 'text-foreground'}`}>{value}</div>
      <p className={`mt-1 text-xs font-semibold ${accent ? 'text-white/70' : 'text-muted-foreground'}`}>{subtle}</p>
    </div>
  );
}

function ModuleTabTrigger({
  value,
  label,
  shortLabel,
  icon: Icon,
}: {
  value: string;
  label: string;
  shortLabel: string;
  icon: any;
}) {
  return (
    <TabsTrigger
      value={value}
      className="min-h-12 rounded-2xl border border-transparent bg-white/60 px-4 py-3 text-left text-slate-600 shadow-sm transition-all hover:border-cyan-200 hover:bg-white hover:text-cyan-700 data-active:border-cyan-500/20 data-active:bg-cyan-700 data-active:text-white dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-cyan-900/60 dark:hover:bg-slate-900 dark:hover:text-white dark:data-active:bg-cyan-500"
    >
      <span className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/5 data-[state=active]:bg-white/15 dark:bg-white/5">
          <Icon className="h-4 w-4" />
        </span>
        <span className="hidden text-[11px] font-black uppercase tracking-[0.22em] sm:inline">{label}</span>
        <span className="text-[11px] font-black uppercase tracking-[0.22em] sm:hidden">{shortLabel}</span>
      </span>
    </TabsTrigger>
  );
}

function ModuleQuickTab({
  value,
  title,
  subtitle,
  summary,
  accent,
  icon: Icon,
  tone,
}: {
  value: string;
  title: string;
  subtitle: string;
  summary: string;
  accent: string;
  icon: any;
  tone: 'cyan' | 'sky' | 'emerald' | 'amber';
}) {
  const toneClasses = {
    cyan: 'from-cyan-500/14 via-sky-500/10 to-white dark:to-slate-950',
    sky: 'from-sky-500/14 via-cyan-500/10 to-white dark:to-slate-950',
    emerald: 'from-emerald-500/14 via-teal-500/10 to-white dark:to-slate-950',
    amber: 'from-amber-500/18 via-orange-500/10 to-white dark:to-slate-950',
  };

  const iconTone = {
    cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300',
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
  };

  return (
    <TabsTrigger
      value={value}
      className={`min-h-[170px] rounded-[1.6rem] border border-white/50 bg-gradient-to-br ${toneClasses[tone]} p-0 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg data-active:border-cyan-500/30 data-active:ring-2 data-active:ring-cyan-500/20`}
    >
      <div className="flex h-full w-full flex-col justify-between p-4">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-[1rem] ${iconTone[tone]}`}>
              <Icon className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform data-[active=true]:translate-x-0.5" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-foreground">{title}</h3>
            <p className="mt-1 text-sm font-medium leading-5 text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <div className="space-y-2 border-t border-white/60 pt-4 dark:border-slate-800/70">
          <div className="text-sm font-semibold text-foreground">{summary}</div>
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
            {accent}
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </TabsTrigger>
  );
}

function QuickInfoCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-[1.25rem] border border-border/60 bg-background/75 p-4 dark:bg-slate-900/40">
      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-black tracking-tight text-foreground">{value}</div>
      <div className="mt-1 text-xs font-semibold text-muted-foreground">{helper}</div>
    </div>
  );
}

function ModuleShell({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28 }}
      className={`module-shell bg-gradient-to-br ${tone}`}
    >
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
