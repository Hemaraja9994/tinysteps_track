import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, Brush } from 'recharts';
import { PlusCircle, Ruler, Activity, History, RotateCcw, Maximize2, Weight, Brain } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { safeFormat } from '../../lib/utils';

const INTERGROWTH_WEIGHT = [
  { week: 24, p3: 450, p10: 500, p50: 600, p90: 750, p97: 850 },
  { week: 28, p3: 800, p10: 950, p50: 1100, p90: 1350, p97: 1500 },
  { week: 32, p3: 1350, p10: 1550, p50: 1850, p90: 2200, p97: 2400 },
  { week: 36, p3: 2000, p10: 2300, p50: 2700, p90: 3200, p97: 3500 },
  { week: 40, p3: 2600, p10: 2900, p50: 3400, p90: 4000, p97: 4300 },
  { week: 44, p3: 3100, p10: 3500, p50: 4100, p90: 4800, p97: 5200 },
  { week: 52, p3: 4000, p10: 4500, p50: 5500, p90: 6500, p97: 7200 },
  { week: 64, p3: 5500, p10: 6300, p50: 7800, p90: 9200, p97: 10200 },
];

const INTERGROWTH_LENGTH = [
  { week: 24, p3: 28, p10: 29, p50: 31, p90: 33, p97: 34 },
  { week: 28, p3: 33, p10: 34, p50: 36, p90: 38, p97: 40 },
  { week: 32, p3: 38, p10: 40, p50: 42, p90: 45, p97: 46 },
  { week: 36, p3: 43, p10: 45, p50: 47, p90: 50, p97: 52 },
  { week: 40, p3: 47, p10: 49, p50: 51, p90: 54, p97: 56 },
  { week: 44, p3: 51, p10: 53, p50: 55, p90: 58, p97: 60 },
  { week: 52, p3: 58, p10: 60, p50: 63, p90: 67, p97: 69 },
];

const INTERGROWTH_HC = [
  { week: 24, p3: 19, p10: 20, p50: 21.5, p90: 23, p97: 24 },
  { week: 28, p3: 23, p10: 24, p50: 26, p90: 28, p97: 29 },
  { week: 32, p3: 27, p10: 28.5, p50: 30.5, p90: 32.5, p97: 33.5 },
  { week: 36, p3: 31, p10: 32.5, p50: 34.5, p90: 36.5, p97: 37.5 },
  { week: 40, p3: 33, p10: 34.5, p50: 36.5, p90: 38.5, p97: 39.5 },
  { week: 52, p3: 37, p10: 39, p50: 41, p90: 43.5, p97: 44.5 },
];

type MetricKey = 'weight' | 'length' | 'headCircumference';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  metricLabel: string;
  unit: string;
}

const CustomTooltip = ({ active, payload, label, metricLabel, unit }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const babyData = payload.find((p) => p.dataKey === 'babyData');
    const p50Data = payload.find((p) => p.dataKey === 'p50');

    return (
      <div className="rounded-[1.35rem] border border-border/60 bg-card/95 p-4 shadow-2xl backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between border-b border-border/50 pb-2">
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Week {label}</span>
          <Badge className="border-none bg-indigo-50 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
            Intergrowth
          </Badge>
        </div>

        <div className="space-y-3">
          {babyData && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-black text-foreground">Baby {metricLabel}</span>
              </div>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-300">
                {babyData.value}
                {unit}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 border-t border-border/40 pt-3">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">Median</div>
              <div className="text-xs font-semibold text-foreground/80">
                {p50Data?.value}
                {unit}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">P3-P97</div>
              <div className="text-xs font-semibold text-foreground/80">
                {payload.find((p) => p.dataKey === 'p3')?.value}-{payload.find((p) => p.dataKey === 'p97')?.value}
                {unit}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function GrowthModule({ baby }: { baby: any }) {
  const [history, setHistory] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeMetric, setActiveMetric] = useState<MetricKey>('weight');
  const [newRecord, setNewRecord] = useState({
    weight: '',
    length: '',
    headCircumference: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const [refAreaLeft, setRefAreaLeft] = useState<number | string>('');
  const [refAreaRight, setRefAreaRight] = useState<number | string>('');
  const [leftDomain, setLeftDomain] = useState<number | 'dataMin'>('dataMin');
  const [rightDomain, setRightDomain] = useState<number | 'dataMax'>('dataMax');

  useEffect(() => {
    const q = query(collection(db, 'babies', baby.id, 'growth'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [baby.id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'babies', baby.id, 'growth'), {
        weight: Number(newRecord.weight),
        length: Number(newRecord.length) || null,
        headCircumference: Number(newRecord.headCircumference) || null,
        date: newRecord.date,
        recordedAt: serverTimestamp(),
      });
      setIsAddOpen(false);
      setNewRecord({ weight: '', length: '', headCircumference: '', date: format(new Date(), 'yyyy-MM-dd') });
      toast.success('Growth entry saved');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save growth entry');
    }
  };

  const metricReference = useMemo(() => {
    switch (activeMetric) {
      case 'length':
        return INTERGROWTH_LENGTH;
      case 'headCircumference':
        return INTERGROWTH_HC;
      default:
        return INTERGROWTH_WEIGHT;
    }
  }, [activeMetric]);

  const chartData = useMemo(() => {
    return metricReference.map((point) => {
      const babyRecord = history.find((record) => {
        const recWeek =
          baby.gestationalAgeAtBirth +
          Math.floor((new Date(record.date).getTime() - new Date(baby.dob).getTime()) / (1000 * 60 * 60 * 24 * 7));
        return recWeek === point.week;
      });
      return {
        ...point,
        babyData: babyRecord ? babyRecord[activeMetric] : null,
      };
    });
  }, [metricReference, history, baby.gestationalAgeAtBirth, baby.dob, activeMetric]);

  const currentWeek = baby.gestationalAgeAtBirth + Math.floor((Date.now() - new Date(baby.dob).getTime()) / (1000 * 60 * 60 * 24 * 7));
  const latestRecord = history.length ? history[history.length - 1] : null;
  const metricLabel = activeMetric === 'weight' ? 'Weight' : activeMetric === 'length' ? 'Length' : 'Head Circ.';
  const unit = activeMetric === 'weight' ? 'g' : 'cm';

  const zoom = () => {
    let [left, right] = [refAreaLeft, refAreaRight];

    if (left === right || right === '') {
      setRefAreaLeft('');
      setRefAreaRight('');
      return;
    }

    if (left > right) [left, right] = [right, left];

    setRefAreaLeft('');
    setRefAreaRight('');
    setLeftDomain(Number(left));
    setRightDomain(Number(right));
  };

  const zoomOut = () => {
    setLeftDomain('dataMin');
    setRightDomain('dataMax');
    setRefAreaLeft('');
    setRefAreaRight('');
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.9fr)]">
        <div className="glass-panel rounded-[1.75rem] p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-indigo-100 text-indigo-700 shadow-inner dark:bg-indigo-950/30 dark:text-indigo-300">
                <Activity className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <Badge className="w-fit border-none bg-indigo-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                  Growth tracker
                </Badge>
                <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Intergrowth follow-up chart</h2>
                <p className="max-w-2xl text-sm font-medium leading-6 text-muted-foreground">
                  Review weight, length, and head circumference in a cleaner chart layout with faster entry logging and more balanced metric cards.
                </p>
              </div>
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger
                nativeButton={false}
                render={
                  <Button className="h-12 rounded-2xl bg-indigo-600 px-5 text-[11px] font-black uppercase tracking-[0.22em] text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add entry
                  </Button>
                }
              />
              <DialogContent className="rounded-[2rem] border-none bg-background sm:max-w-[560px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black tracking-tight text-foreground">Record growth</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAdd} className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Weight (g)">
                      <Input type="number" value={newRecord.weight} onChange={(e) => setNewRecord({ ...newRecord, weight: e.target.value })} required placeholder="1250" className="rounded-xl border-border bg-muted" />
                    </Field>
                    <Field label="Date">
                      <Input type="date" value={newRecord.date} onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })} required className="rounded-xl border-border bg-muted" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Length (cm)">
                      <Input type="number" value={newRecord.length} onChange={(e) => setNewRecord({ ...newRecord, length: e.target.value })} placeholder="Optional" className="rounded-xl border-border bg-muted" />
                    </Field>
                    <Field label="Head Circ. (cm)">
                      <Input type="number" value={newRecord.headCircumference} onChange={(e) => setNewRecord({ ...newRecord, headCircumference: e.target.value })} placeholder="Optional" className="rounded-xl border-border bg-muted" />
                    </Field>
                  </div>
                  <Button type="submit" className="h-12 w-full rounded-2xl bg-indigo-600 text-[11px] font-black uppercase tracking-[0.22em] text-white hover:bg-indigo-700">
                    Save record
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          <MetricCard icon={Weight} label="Latest weight" value={latestRecord?.weight ? `${latestRecord.weight}g` : '--'} tone="indigo" />
          <MetricCard icon={Ruler} label="Latest length" value={latestRecord?.length ? `${latestRecord.length}cm` : '--'} tone="emerald" />
          <MetricCard icon={Brain} label="Head circ." value={latestRecord?.headCircumference ? `${latestRecord.headCircumference}cm` : '--'} tone="amber" />
          <MetricCard icon={Maximize2} label="Current chart" value={metricLabel} tone="slate" />
        </div>
      </section>

      <Card className="metric-card rounded-[1.75rem] border-none p-0">
        <CardHeader className="border-b border-border/60 px-5 pb-4 pt-5 sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl font-black tracking-tight text-foreground">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                Postnatal growth chart
              </CardTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <CardDescription className="text-sm font-medium text-muted-foreground">
                  INTERGROWTH-21st reference with recorded baby measurements.
                </CardDescription>
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  Drag to zoom
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(['weight', 'length', 'headCircumference'] as MetricKey[]).map((metric) => (
                <Button
                  key={metric}
                  variant={activeMetric === metric ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveMetric(metric)}
                  className={`rounded-xl px-4 text-[10px] font-black uppercase tracking-[0.22em] ${activeMetric === metric ? 'bg-indigo-600 text-white hover:bg-indigo-700' : ''}`}
                >
                  {metric === 'weight' ? 'Weight' : metric === 'length' ? 'Length' : 'Head'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-5 py-5 sm:px-6">
          <div className="relative h-[420px] w-full">
            <AnimatePresence>
              {(leftDomain !== 'dataMin' || rightDomain !== 'dataMax') && (
                <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} className="absolute right-2 top-2 z-10">
                  <Button variant="outline" size="sm" onClick={zoomOut} className="rounded-xl text-[10px] font-black uppercase tracking-[0.22em]">
                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                    Reset zoom
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 20 }}
                onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel || '')}
                onMouseMove={(e) => refAreaLeft && e && setRefAreaRight(e.activeLabel || '')}
                onMouseUp={zoom}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} strokeOpacity={0.35} />
                <XAxis
                  dataKey="week"
                  fontSize={10}
                  fontWeight="bold"
                  stroke="#94a3b8"
                  axisLine={false}
                  tickLine={false}
                  domain={[leftDomain, rightDomain]}
                  type="number"
                  allowDataOverflow
                  tickFormatter={(val) => `W${val}`}
                />
                <YAxis fontSize={10} fontWeight="bold" stroke="#94a3b8" axisLine={false} tickLine={false} allowDataOverflow />
                <Tooltip content={<CustomTooltip metricLabel={metricLabel} unit={unit} />} cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5' }} />

                <Line type="monotone" dataKey="p97" stroke="#cbd5e1" strokeWidth={1} dot={false} strokeDasharray="5 5" opacity={0.7} />
                <Line type="monotone" dataKey="p90" stroke="#cbd5e1" strokeWidth={1} dot={false} strokeDasharray="3 3" opacity={0.7} />
                <Line type="monotone" dataKey="p50" stroke="#6366f1" strokeWidth={2} dot={false} opacity={0.35} />
                <Line type="monotone" dataKey="p10" stroke="#cbd5e1" strokeWidth={1} dot={false} strokeDasharray="3 3" opacity={0.7} />
                <Line type="monotone" dataKey="p3" stroke="#cbd5e1" strokeWidth={1} dot={false} strokeDasharray="5 5" opacity={0.7} />

                <Line
                  type="monotone"
                  dataKey="babyData"
                  stroke="#10b981"
                  strokeWidth={4}
                  strokeLinecap="round"
                  dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, fill: '#fff', strokeWidth: 4, stroke: '#10b981' }}
                  name={`Recorded ${activeMetric}`}
                  animationDuration={900}
                />

                <ReferenceLine x={currentWeek} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'top', value: 'Today', fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }} />

                {refAreaLeft && refAreaRight ? <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#6366f1" fillOpacity={0.06} /> : null}

                <Brush dataKey="week" height={26} stroke="#6366f1" fill="transparent" travellerWidth={10} gap={5}>
                  <LineChart>
                    <Line type="monotone" dataKey="babyData" stroke="#10b981" dot={false} />
                  </LineChart>
                </Brush>
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <MiniMetric title={`Recent ${metricLabel}`} value={latestRecord?.[activeMetric] ? `${latestRecord[activeMetric]}${unit}` : '--'} />
            <MiniMetric title="Target band" value="P10-P90" />
            <MiniMetric title="Today week" value={`W${currentWeek}`} />
          </div>
        </CardContent>
      </Card>

      <Card className="metric-card rounded-[1.75rem] border-none p-0">
        <CardHeader className="border-b border-border/60 px-5 pb-4 pt-5 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-xl font-black tracking-tight text-foreground">
            <History className="h-5 w-5 text-indigo-500" />
            Measurement history
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-5 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {history.slice().reverse().map((rec) => (
              <div key={rec.id} className="rounded-[1.35rem] border border-border/60 bg-background/75 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-slate-900/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">{safeFormat(rec.date, 'MMM dd, yyyy')}</div>
                    <div className="mt-2 text-xl font-black tracking-tight text-foreground">
                      {rec[activeMetric] ? `${rec[activeMetric]}${activeMetric === 'weight' ? 'g' : 'cm'}` : '--'}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-muted p-3 text-indigo-600 dark:bg-slate-800 dark:text-indigo-300">
                    {activeMetric === 'weight' ? <Weight className="h-5 w-5" /> : activeMetric === 'length' ? <Ruler className="h-5 w-5" /> : <Brain className="h-5 w-5" />}
                  </div>
                </div>

                <div className="mt-4 grid gap-2 text-xs font-semibold text-muted-foreground">
                  <span>Weight: {rec.weight ? `${rec.weight}g` : '--'}</span>
                  <span>Length: {rec.length ? `${rec.length}cm` : '--'}</span>
                  <span>Head circumference: {rec.headCircumference ? `${rec.headCircumference}cm` : '--'}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  tone: 'indigo' | 'emerald' | 'amber' | 'slate';
}) {
  const tones = {
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
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

function MiniMetric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-border/60 bg-muted/35 p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">{title}</div>
      <div className="mt-1 text-xl font-black tracking-tight text-foreground">{value}</div>
    </div>
  );
}
