import { Badge } from '../ui/badge';
import { Globe, GraduationCap, Hospital, IdCard, Linkedin, Github, Award, BookOpen, UserRound } from 'lucide-react';

const PROFILE_LABELS = ['IRINS Profile', 'Google Scholar', 'ORCID'];

export default function AppCredits() {
  return (
    <footer className="mt-8">
      <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="space-y-4">
            <div className="space-y-2">
              <Badge className="w-fit border-none bg-cyan-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
                Concept & Credits
              </Badge>
              <h2 className="text-2xl font-black tracking-tight text-foreground">TinySteps clinical concept and platform acknowledgment</h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Concept and creation by <span className="font-black text-foreground">Mr. Hemaraja Nayaka S</span>, Associate Professor, MSc (SLP), Dip. in HA & ET - AIISH, PGDBEME, Department of Audiology & Speech-Language Pathology, Yenepoya Medical College Hospital, Mangaluru.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard icon={GraduationCap} label="Designation" value="Associate Professor" helper="Dept. of Audiology & Speech-Language Pathology" />
              <InfoCard icon={Hospital} label="Institution" value="Yenepoya Medical College Hospital" helper="Mangaluru" />
              <InfoCard icon={Award} label="Qualifications" value="MSc (SLP), Dip. in HA & ET - AIISH, PGDBEME" helper="Clinical and academic leadership" />
              <InfoCard icon={IdCard} label="Professional IDs" value="RCI: A30294 | ISHA: L-13072161" helper="Contact: 0824-2204667 Ext 2229 | 9449499659" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-border/60 bg-background/75 p-4 dark:bg-slate-900/40">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                <UserRound className="h-4 w-4" />
                Mentorship
              </div>
              <p className="mt-3 text-sm leading-6 text-foreground">
                Clinical mentorship acknowledged: <span className="font-black">Dr. Mithun</span>, Neonatologist and Professor in Pediatrics, Yenepoya Medical College Hospital.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-border/60 bg-background/75 p-4 dark:bg-slate-900/40">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                Research & Academic Profiles
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {PROFILE_LABELS.map((label) => (
                  <span key={label} className="inline-flex items-center rounded-full bg-cyan-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-200">
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-border/60 bg-background/75 p-4 dark:bg-slate-900/40">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                <Globe className="h-4 w-4" />
                Developer & Professional Links
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <ProfileChip icon={Globe} label="Google Dev" />
                <ProfileChip icon={Github} label="GitHub" />
                <ProfileChip icon={Linkedin} label="LinkedIn" />
                <ProfileChip icon={Globe} label="Website" />
              </div>
              <p className="mt-3 text-xs font-medium leading-5 text-muted-foreground">
                External URLs were not provided, so these are shown as profile labels for now and can be turned into links any time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function InfoCard({ icon: Icon, label, value, helper }: { icon: any; label: string; value: string; helper: string }) {
  return (
    <div className="rounded-[1.35rem] border border-border/60 bg-background/75 p-4 dark:bg-slate-900/40">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
          <div className="mt-1 text-sm font-black text-foreground">{value}</div>
          <div className="mt-1 text-xs font-semibold text-muted-foreground">{helper}</div>
        </div>
      </div>
    </div>
  );
}

function ProfileChip({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
