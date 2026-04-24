import { useMemo, useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Eye, Plus, Calendar, FileText, Download, Copy, Sparkles, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { safeFormat } from '../../lib/utils';

type EyeResult = {
  stage: string;
  zone: string;
  plusDisease: string;
  findings: string;
};

type EyeReport = {
  id: string;
  date: string;
  examinerName?: string;
  centerName?: string;
  stage?: string;
  zone?: string;
  plusDisease?: string;
  fundusFindings?: string;
  followUpDate?: string;
  reportStatus?: string;
  impression?: string;
  treatmentPlan?: string;
  leftEye?: EyeResult;
  rightEye?: EyeResult;
  recordedAt?: unknown;
};

const DEFAULT_EYE_RESULT: EyeResult = {
  stage: 'No ROP',
  zone: 'II',
  plusDisease: 'No',
  findings: 'Retina attached, vessels appropriate for age',
};

const STAGE_OPTIONS = ['No ROP', 'Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Stage 5'];
const PLUS_OPTIONS = ['No', 'Pre-Plus', 'Plus'];
const REPORT_STATUS_OPTIONS = ['Routine surveillance', 'Needs early review', 'Treatment advised', 'Post-treatment follow-up'];

function createInitialFormState() {
  return {
    date: format(new Date(), 'yyyy-MM-dd'),
    examinerName: '',
    centerName: '',
    reportStatus: 'Routine surveillance',
    leftEye: { ...DEFAULT_EYE_RESULT },
    rightEye: { ...DEFAULT_EYE_RESULT },
    impression: 'No active ROP. Continue scheduled surveillance.',
    treatmentPlan: 'Routine retinal screening follow-up as advised.',
    followUpDate: '',
  };
}

export default function EyeModule({ baby }: { baby: any }) {
  const [screenings, setScreenings] = useState<EyeReport[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<EyeReport | null>(null);
  const [formData, setFormData] = useState(createInitialFormState());

  useEffect(() => {
    const q = query(collection(db, 'babies', baby.id, 'eyes'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setScreenings(snapshot.docs.map((doc) => normalizeReport({ id: doc.id, ...doc.data() } as any)));
    });
    return unsubscribe;
  }, [baby.id]);

  const stats = useMemo(() => {
    const severeCount = screenings.filter((screening) => hasAlert(screening)).length;
    const routineCount = screenings.filter((screening) => !hasAlert(screening)).length;
    return {
      total: screenings.length,
      severeCount,
      routineCount,
    };
  }, [screenings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = buildReportPayload(formData);
      await addDoc(collection(db, 'babies', baby.id, 'eyes'), {
        ...payload,
        recordedAt: serverTimestamp(),
      });
      setIsAddOpen(false);
      setFormData(createInitialFormState());
      toast.success('Retinal screening report saved');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save retinal screening report');
    }
  };

  const handleDownload = (report: EyeReport) => {
    const text = buildReportText(baby, report);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${baby.name.replace(/\s+/g, '-').toLowerCase()}-retinal-screening-${report.date}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async (report: EyeReport) => {
    try {
      await navigator.clipboard.writeText(buildReportText(baby, report));
      toast.success('Report copied to clipboard');
    } catch (error) {
      console.error(error);
      toast.error('Unable to copy report');
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]">
        <div className="glass-panel rounded-[1.75rem] p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-rose-100 text-rose-700 shadow-inner dark:bg-rose-950/30 dark:text-rose-300">
                <Eye className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <Badge className="w-fit border-none bg-rose-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                  Retinal screening
                </Badge>
                <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">ROP and retinal report saving</h2>
                <p className="max-w-2xl text-sm font-medium leading-6 text-muted-foreground">
                  Save fuller ophthalmology reports with examiner details, separate left and right eye findings, impression, treatment plan, and a reusable printable report.
                </p>
              </div>
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger
                nativeButton={false}
                render={
                  <Button className="h-12 rounded-2xl bg-rose-600 px-5 text-[11px] font-black uppercase tracking-[0.22em] text-white shadow-lg shadow-rose-500/20 hover:bg-rose-700">
                    <Plus className="mr-2 h-4 w-4" />
                    New report
                  </Button>
                }
              />
              <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[2rem] border-none bg-background sm:max-w-[820px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black tracking-tight text-foreground">Retinal screening report</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-2">
                  <div className="grid gap-4 rounded-[1.5rem] bg-muted/70 p-4 md:grid-cols-3">
                    <Field label="Exam Date">
                      <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required className="rounded-xl border-border bg-card" />
                    </Field>
                    <Field label="Examiner">
                      <Input value={formData.examinerName} onChange={(e) => setFormData({ ...formData, examinerName: e.target.value })} placeholder="Dr. name" className="rounded-xl border-border bg-card" />
                    </Field>
                    <Field label="Center / Unit">
                      <Input value={formData.centerName} onChange={(e) => setFormData({ ...formData, centerName: e.target.value })} placeholder="NICU / Retina clinic" className="rounded-xl border-border bg-card" />
                    </Field>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <EyeSideEditor
                      title="Left Eye"
                      value={formData.leftEye}
                      onChange={(leftEye) => setFormData({ ...formData, leftEye })}
                    />
                    <EyeSideEditor
                      title="Right Eye"
                      value={formData.rightEye}
                      onChange={(rightEye) => setFormData({ ...formData, rightEye })}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Report Status">
                      <Select value={formData.reportStatus} onValueChange={(reportStatus) => setFormData({ ...formData, reportStatus })}>
                        <SelectTrigger className="rounded-xl border-border bg-card"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {REPORT_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Follow-up Date">
                      <Input type="date" value={formData.followUpDate} onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })} className="rounded-xl border-border bg-card" />
                    </Field>
                  </div>

                  <Field label="Clinical Impression">
                    <textarea
                      value={formData.impression}
                      onChange={(e) => setFormData({ ...formData, impression: e.target.value })}
                      className="min-h-[96px] w-full rounded-xl border border-border bg-card p-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-rose-100 dark:focus:ring-rose-950/40"
                      placeholder="Summarize the retinal screening impression"
                    />
                  </Field>

                  <Field label="Treatment / Advice">
                    <textarea
                      value={formData.treatmentPlan}
                      onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                      className="min-h-[96px] w-full rounded-xl border border-border bg-card p-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-rose-100 dark:focus:ring-rose-950/40"
                      placeholder="Laser / anti-VEGF advice / surveillance / referral notes"
                    />
                  </Field>

                  <Button type="submit" className="h-12 w-full rounded-2xl bg-rose-600 text-sm font-black uppercase tracking-[0.22em] text-white hover:bg-rose-700">
                    Save retinal report
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <MetricCard icon={FileText} label="Saved reports" value={String(stats.total)} tone="rose" />
          <MetricCard icon={CheckCircle2} label="Routine follow-up" value={String(stats.routineCount)} tone="emerald" />
          <MetricCard icon={ShieldAlert} label="Alert reports" value={String(stats.severeCount)} tone="amber" />
        </div>
      </section>

      <section className="grid gap-4">
        {screenings.map((screening) => (
          <Card key={screening.id} className="metric-card rounded-[1.75rem] border-none p-0">
            <CardHeader className="border-b border-border/60 px-5 pb-4 pt-5 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`border-none px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${hasAlert(screening) ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
                      {screening.reportStatus || 'Routine surveillance'}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      {safeFormat(screening.date, 'MMMM dd, yyyy')}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-black tracking-tight text-foreground">
                    {screening.impression || summarizeLegacyReport(screening)}
                  </CardTitle>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-muted-foreground">
                    <span>{screening.examinerName || 'Examiner not recorded'}</span>
                    <span>{screening.centerName || 'Center not recorded'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="rounded-xl text-[10px] font-black uppercase tracking-[0.2em]" onClick={() => setSelectedReport(screening)}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    View report
                  </Button>
                  <Button variant="outline" className="rounded-xl text-[10px] font-black uppercase tracking-[0.2em]" onClick={() => handleCopy(screening)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button className="rounded-xl bg-rose-600 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-rose-700" onClick={() => handleDownload(screening)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_240px]">
              <EyeSummaryCard title="Left Eye" result={screening.leftEye || legacyEyeFromReport(screening)} />
              <EyeSummaryCard title="Right Eye" result={screening.rightEye || legacyEyeFromReport(screening)} />

              <div className="rounded-[1.35rem] border border-border/60 bg-background/75 p-4 dark:bg-slate-900/40">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Follow-up
                </div>
                <div className="mt-3 text-xl font-black tracking-tight text-foreground">
                  {screening.followUpDate ? safeFormat(screening.followUpDate, 'MMM dd, yyyy', 'TBD') : 'TBD'}
                </div>
                <div className="mt-4 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Treatment plan</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {screening.treatmentPlan || 'No treatment plan recorded.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {screenings.length === 0 && (
          <div className="rounded-[1.75rem] border border-dashed border-border bg-background/70 px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
              <Eye className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-xl font-black tracking-tight text-foreground">No retinal reports saved yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm font-medium text-muted-foreground">
              Start by saving the first ROP screening report with bilateral findings and follow-up advice.
            </p>
          </div>
        )}
      </section>

      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[2rem] border-none bg-background sm:max-w-[860px]">
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight text-foreground">Saved retinal screening report</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-2">
                <div className="glass-panel rounded-[1.5rem] p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Patient</p>
                      <h3 className="mt-1 text-2xl font-black tracking-tight text-foreground">{baby.name}</h3>
                      <p className="mt-2 text-sm font-medium text-muted-foreground">
                        Exam on {safeFormat(selectedReport.date, 'MMMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" className="rounded-xl text-[10px] font-black uppercase tracking-[0.2em]" onClick={() => handleCopy(selectedReport)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy report
                      </Button>
                      <Button className="rounded-xl bg-rose-600 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-rose-700" onClick={() => handleDownload(selectedReport)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download report
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <EyeSummaryCard title="Left Eye" result={selectedReport.leftEye || legacyEyeFromReport(selectedReport)} large />
                  <EyeSummaryCard title="Right Eye" result={selectedReport.rightEye || legacyEyeFromReport(selectedReport)} large />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoBlock title="Clinical impression" value={selectedReport.impression || summarizeLegacyReport(selectedReport)} />
                  <InfoBlock title="Treatment / advice" value={selectedReport.treatmentPlan || 'No treatment or advice recorded.'} />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <MiniInfo title="Examiner" value={selectedReport.examinerName || 'Not recorded'} />
                  <MiniInfo title="Center" value={selectedReport.centerName || 'Not recorded'} />
                  <MiniInfo title="Follow-up date" value={selectedReport.followUpDate ? safeFormat(selectedReport.followUpDate, 'MMM dd, yyyy', 'TBD') : 'TBD'} />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
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

function EyeSideEditor({
  title,
  value,
  onChange,
}: {
  title: string;
  value: EyeResult;
  onChange: (value: EyeResult) => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-rose-100 bg-rose-50/60 p-4 dark:border-rose-950/40 dark:bg-rose-950/10">
      <h4 className="mb-4 text-xs font-black uppercase tracking-[0.24em] text-rose-700 dark:text-rose-300">{title}</h4>
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ROP Stage">
            <Select value={value.stage} onValueChange={(stage) => onChange({ ...value, stage })}>
              <SelectTrigger className="rounded-xl border-white/60 bg-white dark:border-slate-700 dark:bg-slate-900"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Zone">
            <Select value={value.zone} onValueChange={(zone) => onChange({ ...value, zone })}>
              <SelectTrigger className="rounded-xl border-white/60 bg-white dark:border-slate-700 dark:bg-slate-900"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="I">Zone I</SelectItem>
                <SelectItem value="II">Zone II</SelectItem>
                <SelectItem value="III">Zone III</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Plus Disease">
          <Select value={value.plusDisease} onValueChange={(plusDisease) => onChange({ ...value, plusDisease })}>
            <SelectTrigger className="rounded-xl border-white/60 bg-white dark:border-slate-700 dark:bg-slate-900"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PLUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Findings">
          <textarea
            value={value.findings}
            onChange={(e) => onChange({ ...value, findings: e.target.value })}
            className="min-h-[88px] w-full rounded-xl border border-white/60 bg-white p-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-rose-100 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-rose-950/40"
            placeholder="Posterior pole, ridge, hemorrhage, media clarity, vessel tortuosity..."
          />
        </Field>
      </div>
    </div>
  );
}

function EyeSummaryCard({
  title,
  result,
  large = false,
}: {
  title: string;
  result: EyeResult;
  large?: boolean;
}) {
  return (
    <div className={`rounded-[1.35rem] border border-border/60 bg-background/75 ${large ? 'p-5' : 'p-4'} dark:bg-slate-900/40`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">{title}</div>
        <Badge className={`border-none text-[10px] font-black uppercase tracking-[0.2em] ${result.plusDisease === 'No' && result.stage === 'No ROP' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>
          {result.stage}
        </Badge>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MiniInfo title="Zone" value={`Zone ${result.zone}`} compact />
        <MiniInfo title="Plus Disease" value={result.plusDisease} compact />
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{result.findings}</p>
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
  tone: 'rose' | 'emerald' | 'amber';
}) {
  const tones = {
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300',
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

function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-border/60 bg-background/75 p-4 dark:bg-slate-900/40">
      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">{title}</div>
      <p className="mt-3 text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}

function MiniInfo({ title, value, compact = false }: { title: string; value: string; compact?: boolean }) {
  return (
    <div className={`${compact ? 'rounded-xl border border-border/50 bg-muted/40 px-3 py-2' : 'rounded-[1.2rem] border border-border/60 bg-background/75 p-4 dark:bg-slate-900/40'}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">{title}</div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function buildReportPayload(formData: ReturnType<typeof createInitialFormState>) {
  const stage = worstStage(formData.leftEye.stage, formData.rightEye.stage);
  const zone = formData.leftEye.zone === formData.rightEye.zone ? formData.leftEye.zone : `${formData.leftEye.zone}/${formData.rightEye.zone}`;
  const plusDisease = formData.leftEye.plusDisease === formData.rightEye.plusDisease ? formData.leftEye.plusDisease : `${formData.leftEye.plusDisease}/${formData.rightEye.plusDisease}`;

  return {
    date: formData.date,
    examinerName: formData.examinerName.trim(),
    centerName: formData.centerName.trim(),
    reportStatus: formData.reportStatus,
    stage,
    zone,
    plusDisease,
    fundusFindings: `Left eye: ${formData.leftEye.findings} | Right eye: ${formData.rightEye.findings}`,
    leftEye: formData.leftEye,
    rightEye: formData.rightEye,
    impression: formData.impression.trim(),
    treatmentPlan: formData.treatmentPlan.trim(),
    followUpDate: formData.followUpDate,
  };
}

function normalizeReport(report: any): EyeReport {
  const legacy: EyeResult = legacyEyeFromReport(report);
  return {
    ...report,
    leftEye: report.leftEye || legacy,
    rightEye: report.rightEye || legacy,
    reportStatus: report.reportStatus || (hasAlert(report) ? 'Needs early review' : 'Routine surveillance'),
    impression: report.impression || summarizeLegacyReport(report),
    treatmentPlan: report.treatmentPlan || '',
  };
}

function legacyEyeFromReport(report: any): EyeResult {
  return {
    stage: report.stage || 'No ROP',
    zone: report.zone || 'II',
    plusDisease: report.plusDisease || 'No',
    findings: report.fundusFindings || 'No detailed findings recorded.',
  };
}

function summarizeLegacyReport(report: any) {
  const stage = report.stage || 'No ROP';
  const zone = report.zone ? `Zone ${report.zone}` : 'zone not recorded';
  const plusDisease = report.plusDisease ? `${report.plusDisease} disease` : 'plus disease not recorded';
  return `${stage}, ${zone}, ${plusDisease}.`;
}

function worstStage(left: string, right: string) {
  const weights: Record<string, number> = {
    'No ROP': 0,
    'Stage 1': 1,
    'Stage 2': 2,
    'Stage 3': 3,
    'Stage 4': 4,
    'Stage 5': 5,
  };
  return (weights[left] || 0) >= (weights[right] || 0) ? left : right;
}

function hasAlert(report: any) {
  const left = report.leftEye || legacyEyeFromReport(report);
  const right = report.rightEye || legacyEyeFromReport(report);
  const alertValues = ['Stage 3', 'Stage 4', 'Stage 5', 'Pre-Plus', 'Plus'];
  return alertValues.includes(left.stage) || alertValues.includes(right.stage) || alertValues.includes(left.plusDisease) || alertValues.includes(right.plusDisease) || report.reportStatus === 'Treatment advised';
}

function buildReportText(baby: any, report: EyeReport) {
  const left = report.leftEye || legacyEyeFromReport(report);
  const right = report.rightEye || legacyEyeFromReport(report);

  return [
    'RETINAL SCREENING REPORT',
    '',
    `Baby Name: ${baby.name}`,
    `Date of Birth: ${safeFormat(baby.dob, 'MMM dd, yyyy', 'Not recorded')}`,
    `Gestational Age at Birth: ${baby.gestationalAgeAtBirth ?? 'Not recorded'} weeks`,
    `Birth Weight: ${baby.birthWeight ?? 'Not recorded'} g`,
    '',
    `Exam Date: ${safeFormat(report.date, 'MMM dd, yyyy', 'Not recorded')}`,
    `Examiner: ${report.examinerName || 'Not recorded'}`,
    `Center: ${report.centerName || 'Not recorded'}`,
    `Report Status: ${report.reportStatus || 'Routine surveillance'}`,
    '',
    'LEFT EYE',
    `Stage: ${left.stage}`,
    `Zone: ${left.zone}`,
    `Plus Disease: ${left.plusDisease}`,
    `Findings: ${left.findings}`,
    '',
    'RIGHT EYE',
    `Stage: ${right.stage}`,
    `Zone: ${right.zone}`,
    `Plus Disease: ${right.plusDisease}`,
    `Findings: ${right.findings}`,
    '',
    `Clinical Impression: ${report.impression || summarizeLegacyReport(report)}`,
    `Treatment / Advice: ${report.treatmentPlan || 'No treatment recorded.'}`,
    `Follow-up Date: ${report.followUpDate ? safeFormat(report.followUpDate, 'MMM dd, yyyy', 'TBD') : 'TBD'}`,
  ].join('\n');
}
