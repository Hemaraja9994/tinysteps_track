import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Bell, MessageSquare, Phone, Save, Check, ShieldCheck, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import AppointmentsModule from './AppointmentsModule';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export default function CareCoordination({ baby }: { baby: any }) {
  const [alerts, setAlerts] = useState({
    whatsapp: baby.alerts?.whatsapp || false,
    sms: baby.alerts?.sms || false,
    phoneNumber: baby.alerts?.phoneNumber || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(!!baby.alerts?.verified);

  const handleSaveAlerts = async () => {
    if ((alerts.whatsapp || alerts.sms) && !alerts.phoneNumber) {
      toast.error('Please provide a mobile number for alerts');
      return;
    }

    if ((alerts.whatsapp || alerts.sms) && !isVerified) {
      toast.error('Please verify your mobile number first');
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'babies', baby.id), {
        alerts: { ...alerts, verified: isVerified },
      });
      toast.success('Alert preferences updated');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update preferences');
    }
    setIsSaving(false);
  };

  const handleVerify = () => {
    if (!alerts.phoneNumber) {
      toast.error('Enter a mobile number to verify');
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerified(true);
      setIsVerifying(false);
      toast.success('Number verified successfully');
    }, 1500);
  };

  const needsPhone = (alerts.whatsapp || alerts.sms) && !alerts.phoneNumber;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="appointments" className="w-full">
        <div className="glass-panel rounded-[1.5rem] p-2">
          <TabsList className="flex h-auto w-full flex-wrap gap-2 rounded-[1.25rem] bg-transparent p-0">
            <TabsTrigger value="appointments" className="min-h-11 rounded-2xl bg-white/70 px-5 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-600 shadow-sm hover:text-indigo-600 data-active:bg-indigo-600 data-active:text-white dark:bg-slate-900/60 dark:text-slate-300 dark:data-active:bg-indigo-500">
              Appointments
            </TabsTrigger>
            <TabsTrigger value="alerts" className="min-h-11 rounded-2xl bg-white/70 px-5 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-600 shadow-sm hover:text-indigo-600 data-active:bg-indigo-600 data-active:text-white dark:bg-slate-900/60 dark:text-slate-300 dark:data-active:bg-indigo-500">
              Alerts & notifications
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="appointments" className="pt-4">
          <AppointmentsModule baby={baby} />
        </TabsContent>

        <TabsContent value="alerts" className="pt-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.85fr)]">
            <Card className="metric-card rounded-[1.75rem] border-none p-0">
              <CardHeader className="border-b border-border/60 px-5 pb-4 pt-5 sm:px-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">
                    <Bell className="h-7 w-7" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black tracking-tight text-foreground">Notification settings</CardTitle>
                    <CardDescription className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
                      Configure verified channels for reminders, schedule nudges, and family communication.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 px-5 py-5 sm:px-6">
                <ChannelCard
                  active={alerts.whatsapp}
                  title="WhatsApp alerts"
                  desc="Real-time chat reminders"
                  icon={<MessageSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />}
                  tone="emerald"
                  onToggle={(checked) => {
                    setAlerts({ ...alerts, whatsapp: checked });
                    if (checked && !isVerified) setIsVerified(false);
                  }}
                />

                <ChannelCard
                  active={alerts.sms}
                  title="SMS gateway"
                  desc="Traditional mobile alerts"
                  icon={<Phone className="h-5 w-5 text-blue-600 dark:text-blue-300" />}
                  tone="blue"
                  onToggle={(checked) => {
                    setAlerts({ ...alerts, sms: checked });
                    if (checked && !isVerified) setIsVerified(false);
                  }}
                />

                <div className={`rounded-[1.35rem] border p-4 transition-all ${needsPhone ? 'border-rose-200 bg-rose-50/70 dark:border-rose-900/40 dark:bg-rose-950/10' : 'border-border/60 bg-muted/40'}`}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Mobile number</Label>
                    {isVerified && (
                      <Badge className="border-none bg-emerald-100 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      placeholder="+91-0000000000"
                      value={alerts.phoneNumber}
                      onChange={(e) => {
                        setAlerts({ ...alerts, phoneNumber: e.target.value });
                        setIsVerified(false);
                      }}
                      className="h-12 rounded-xl border-border bg-background/80 font-semibold"
                    />
                    {!isVerified && alerts.phoneNumber && (
                      <Button
                        onClick={handleVerify}
                        disabled={isVerifying}
                        variant="outline"
                        className="h-12 rounded-xl px-4 text-[11px] font-black uppercase tracking-[0.22em]"
                      >
                        {isVerifying ? 'Verifying...' : 'Verify'}
                      </Button>
                    )}
                  </div>
                  {needsPhone && (
                    <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-300">
                      A verified number is required before automated alerts can be enabled.
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleSaveAlerts}
                  disabled={isSaving || ((alerts.whatsapp || alerts.sms) && !isVerified)}
                  className="h-12 w-full rounded-2xl bg-indigo-600 text-[11px] font-black uppercase tracking-[0.22em] text-white hover:bg-indigo-700"
                >
                  {isSaving ? 'Updating...' : <><Save className="mr-2 h-4 w-4" /> Save preferences</>}
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <InfoStat icon={ShieldCheck} title="Verification" value={isVerified ? 'Ready' : 'Pending'} helper={isVerified ? 'Family contact can receive reminders.' : 'Verify the primary number to activate alerts.'} tone="emerald" />
              <InfoStat icon={CalendarClock} title="Reminder channels" value={`${Number(alerts.whatsapp) + Number(alerts.sms)}`} helper="Active communication methods" tone="indigo" />

              <div className="glass-panel rounded-[1.75rem] p-5 sm:p-6">
                <h4 className="text-xl font-black tracking-tight text-foreground">Why enable alerts?</h4>
                <div className="mt-5 space-y-4">
                  {[
                    'Missed clinical appointments can increase follow-up risk.',
                    'Vaccination nudges reduce delay in schedule completion.',
                    'Verified messaging enables faster parent communication.',
                    'Education can be aligned to corrected developmental age.',
                  ].map((text) => (
                    <div key={text} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-sm font-medium leading-6 text-muted-foreground">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChannelCard({
  active,
  title,
  desc,
  icon,
  tone,
  onToggle,
}: {
  active: boolean;
  title: string;
  desc: string;
  icon: React.ReactNode;
  tone: 'emerald' | 'blue';
  onToggle: (checked: boolean) => void;
}) {
  const toneClasses = {
    emerald: active ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/10' : 'border-border/60 bg-muted/40',
    blue: active ? 'border-blue-200 bg-blue-50/70 dark:border-blue-900/40 dark:bg-blue-950/10' : 'border-border/60 bg-muted/40',
  };

  return (
    <div className={`flex items-center justify-between gap-4 rounded-[1.35rem] border p-4 transition-all ${toneClasses[tone]}`}>
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background/80 dark:bg-slate-900/60">
          {icon}
        </div>
        <div>
          <Label className="text-sm font-black text-foreground">{title}</Label>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Switch checked={active} onCheckedChange={onToggle} />
    </div>
  );
}

function InfoStat({
  icon: Icon,
  title,
  value,
  helper,
  tone,
}: {
  icon: any;
  title: string;
  value: string;
  helper: string;
  tone: 'emerald' | 'indigo';
}) {
  const tones = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300',
  };

  return (
    <div className="metric-card rounded-[1.5rem] p-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">{title}</div>
      <div className="mt-1 text-2xl font-black tracking-tight text-foreground">{value}</div>
      <div className="mt-1 text-xs font-semibold text-muted-foreground">{helper}</div>
    </div>
  );
}
