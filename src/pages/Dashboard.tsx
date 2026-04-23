import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '../components/ui/dialog';
import { PlusCircle, Baby as BabyIcon, ChevronRight, Activity, Calendar, Trash2, HeartPulse, ShieldAlert, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { exportBabiesRegistryCsv, exportDashboardStatsCsv } from '../lib/reporting';

const CLINICAL_GUIDELINES = {
  kmc: {
    title: "Kangaroo Mother Care (KMC)",
    content: `
# Kangaroo Mother Care (KMC)
KMC is a method of care for preterm infants which involves early, continuous and prolonged skin-to-skin contact between a mother and her newborn low birth weight infant and exclusive breastfeeding.

### Key Components:
1. **Kangaroo Position**: Skin-to-skin contact on the mother's chest.
2. **Kangaroo Nutrition**: Exclusive breastfeeding or expressed breast milk.
3. **Kangaroo Support**: Medical and family support for the mother.

### Benefits:
* Reduces neonatal mortality and sepsis.
* Better thermal regulation and weight gain.
* Improved bonding and breastfeeding success.
    `
  },
  feeding: {
    title: "Breast/Tube Feeding",
    content: `
# Nutritional Transition Strategies
Feeding preterm infants requires a graded approach depending on gestational age and stability.

### Feeding Methods:
1. **Parenteral Nutrition**: For very unstable or extremely preterm infants.
2. **Enteral Feeding (OG/NG Tube)**: Used when the baby cannot yet coordinate suck-swallow-breath.
3. **Paladay/Spoon Feeding**: Transition step before direct breastfeeding.
4. **Direct Breastfeeding**: The ultimate goal for maternal bonding and immunity.

### Monitoring:
* Watch for abdominal distension or gastric residuals.
* Monitor daily weight gain (target: 15-20g/kg/day).
    `
  },
  sleep: {
    title: "Safe Sleep Habits",
    content: `
# Safe Sleep Environment
Preterm infants are at higher risk for sleep-related complications.

### Safe Sleep Rules:
* **Back to Sleep**: Always place the baby on their back to sleep.
* **Firm Surface**: Use a firm sleep surface covered by a fitted sheet.
* **Clear Space**: No pillows, blankets, or toys in the crib.
* **Temperature**: Keep the room at a comfortable temperature (around 24-26°C).

### Monitoring:
* Use a pulse oximeter if prescribed by your neonatologist.
* Never sleep with the baby in an adult bed.
    `
  },
  govt: {
    title: "Govt Guidelines (Karnataka)",
    content: `
# Karnataka State Health Guidelines
Specific protocols for follow-up of High-Risk Newborns in Karnataka.

### Follow-up Schedule:
1. **1st Visit**: Within 48 hours of discharge.
2. **Weekly**: For the first month.
3. **Fortnightly**: Up to 3 months.
4. **Monthly**: Up to 1 year.

### Screening Mandates:
* **Hearing (OAE/BERA)**: Must be completed before 1 month.
* **Eye (ROP)**: Screening at 4 weeks or 30 days of life.
* **Developmental Screening**: Assessment at DEIC (District Early Intervention Centres).
    `
  }
};

export default function Dashboard() {
  const { profile } = useAuth();
  const [babies, setBabies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'high-risk' | 'stable'>('all');
  const [search, setSearch] = useState('');
  const [newBaby, setNewBaby] = useState({
    name: '',
    dob: '',
    gestationalAgeAtBirth: 28,
    birthWeight: 1000,
    pocdNumber: '',
    mrNumber: '',
    motherUniqueId: '',
    taluk: '',
    district: 'Mysuru',
    state: 'Karnataka',
    region: 'Urban',
    socioEconomicStatus: 'APL',
    numSiblings: 0,
    deliveryType: 'Normal',
    highRiskFactors: [] as string[]
  });

  useEffect(() => {
    if (!profile) return;

    let q;
    if (profile.role === 'parent') {
      q = query(collection(db, 'babies'), where('parents', 'array-contains', profile.uid));
    } else if (profile.role === 'neonatologist' || profile.role === 'audiologist') {
      // In real world, we'd filter by institution/clinic
      q = collection(db, 'babies');
    } else {
      q = collection(db, 'babies');
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBabies(list);
      setLoading(false);
    });

    return unsubscribe;
  }, [profile]);

  const HRR_FACTORS = [
    "NICU stay > 5 days",
    "Aminoglycoside > 5 days",
    "Birth Asphyxia",
    "ECMO",
    "In utero infections",
    "Culture positive infection",
    "Hyperbilirubinemia",
    "Seizures",
    "Craniofacial anomalies",
    "Hearing loss syndromes"
  ];

  const handleAddBaby = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      await addDoc(collection(db, 'babies'), {
        ...newBaby,
        parents: [profile.uid],
        careTeam: [],
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
      setIsAddOpen(false);
      setNewBaby({
        name: '', dob: '', gestationalAgeAtBirth: 28, birthWeight: 1000,
        pocdNumber: '', mrNumber: '', motherUniqueId: '', taluk: '', district: 'Mysuru', state: 'Karnataka',
        region: 'Urban', socioEconomicStatus: 'APL', numSiblings: 0, deliveryType: 'Normal', highRiskFactors: []
      });
    } catch (error) {
      console.error("Failed to add baby", error);
      toast.error("Enrollment failed. Please try again.");
    }
  };

  const handleDeleteBaby = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'babies', id));
      toast.success("Profile deleted successfully");
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Delete failed", error);
      toast.error("Failed to delete profile");
    }
  };

  const isSpecialist = profile?.role !== 'parent';

  const stats = {
    total: babies.length,
    highRisk: babies.filter(b => b.highRiskFactors?.length > 0).length,
    stable: babies.length - babies.filter(b => b.highRiskFactors?.length > 0).length
  };
  const avgBirthWeight = babies.length ? Math.round(babies.reduce((sum, baby) => sum + (Number(baby.birthWeight) || 0), 0) / babies.length) : 0;
  const avgGestation = babies.length ? Math.round((babies.reduce((sum, baby) => sum + (Number(baby.gestationalAgeAtBirth) || 0), 0) / babies.length) * 10) / 10 : 0;
  const urbanCount = babies.filter((baby) => baby.region === 'Urban').length;
  const ruralCount = babies.filter((baby) => baby.region === 'Rural').length;

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {isSpecialist && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
             <Card className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-none shadow-xl rounded-[32px] overflow-hidden">
               <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <TrendingUp className="w-8 h-8 text-indigo-200" />
                    <Badge className="bg-white/20 text-white border-none font-black text-[10px] uppercase">Monitoring</Badge>
                  </div>
                  <p className="text-sm font-bold text-indigo-100/80 uppercase tracking-widest">Total Active Infants</p>
                  <h2 className="text-5xl font-black tracking-tighter mt-1">{stats.total}</h2>
               </CardContent>
             </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
             <Card className="bg-card border-border shadow-sm rounded-[32px] overflow-hidden">
               <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <HeartPulse className="w-8 h-8 text-emerald-500" />
                    <Badge className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-none font-black text-[10px] uppercase">Stable</Badge>
                  </div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Low Risk Profiles</p>
                  <h2 className="text-5xl font-black text-foreground tracking-tighter mt-1">{stats.stable}</h2>
               </CardContent>
             </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
             <Card className="bg-card border-rose-100 dark:border-rose-900 border-2 shadow-sm rounded-[32px] overflow-hidden relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -mr-16 -mt-16 animate-pulse" />
               <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <ShieldAlert className="w-8 h-8 text-rose-500" />
                    <Badge className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-none font-black text-[10px] uppercase">Priority</Badge>
                  </div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">High Risk Register</p>
                  <h2 className="text-5xl font-black text-rose-600 tracking-tighter mt-1">{stats.highRisk}</h2>
               </CardContent>
             </Card>
          </motion.div>
        </section>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight italic">Care Hub</h1>
          <p className="text-muted-foreground font-medium tracking-tight">Global Preterm Development & Monitoring Registry</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Input 
              placeholder="Search by name or ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl h-12 pl-4 pr-10 border-border bg-card shadow-sm" 
            />
            <Activity className="absolute right-4 top-4 h-4 w-4 text-muted-foreground opacity-50" />
          </div>

          <Button
            variant="outline"
            className="h-12 rounded-xl border-border bg-card px-4 text-[11px] font-black uppercase tracking-[0.18em]"
            onClick={() => exportDashboardStatsCsv(babies)}
          >
            Export Stats CSV
          </Button>

          <Button
            variant="outline"
            className="h-12 rounded-xl border-border bg-card px-4 text-[11px] font-black uppercase tracking-[0.18em]"
            onClick={() => exportBabiesRegistryCsv(babies)}
          >
            Export Registry CSV
          </Button>

          {(profile?.role === 'parent' || profile?.role === 'neonatologist' || profile?.role === 'audiologist') && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger nativeButton={false} render={
                <Button className="bg-indigo-600 hover:bg-indigo-700 h-12 px-6 rounded-xl font-bold shadow-lg shadow-indigo-100 text-sm tracking-wide shrink-0">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Enroll Profile
                </Button>
              } />
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-[40px] border-none shadow-2xl p-0 bg-background">
                <div className="p-8 bg-indigo-600 dark:bg-indigo-700 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-3xl font-black text-white">Newborn Enrollment</DialogTitle>
                    <DialogDescription className="font-bold text-indigo-100/80">
                      Establishing clinical follow-up and developmental tracking.
                    </DialogDescription>
                  </DialogHeader>
                </div>
                <form onSubmit={handleAddBaby} className="p-8 space-y-8">
                  <section className="space-y-4">
                    <h3 className="font-black text-xs uppercase tracking-widest text-indigo-600 border-b border-indigo-50 pb-2">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="font-bold text-slate-700">Baby's Name</Label>
                        <Input id="name" value={newBaby.name} onChange={e => setNewBaby({...newBaby, name: e.target.value})} required className="rounded-xl border-slate-200" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="dob" className="font-bold text-slate-700">DOB</Label>
                          <Input id="dob" type="date" value={newBaby.dob} onChange={e => setNewBaby({...newBaby, dob: e.target.value})} required className="rounded-xl border-slate-200" />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-slate-700">Region</Label>
                          <select 
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium"
                            value={newBaby.region}
                            onChange={e => setNewBaby({...newBaby, region: e.target.value})}
                          >
                            <option value="Urban">Urban</option>
                            <option value="Rural">Rural</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ga" className="font-bold text-slate-700">Gestational Age (Weeks)</Label>
                        <Input id="ga" type="number" value={newBaby.gestationalAgeAtBirth} onChange={e => setNewBaby({...newBaby, gestationalAgeAtBirth: Number(e.target.value)})} required className="rounded-xl border-slate-200" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weight" className="font-bold text-slate-700">Birth Weight (g)</Label>
                        <Input id="weight" type="number" value={newBaby.birthWeight} onChange={e => setNewBaby({...newBaby, birthWeight: Number(e.target.value)})} required className="rounded-xl border-slate-200" />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="font-black text-xs uppercase tracking-widest text-indigo-600 border-b border-indigo-50 pb-2">Identification & Clinical Registration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-slate-400">POCD Number</Label>
                        <Input value={newBaby.pocdNumber} onChange={e => setNewBaby({...newBaby, pocdNumber: e.target.value})} className="rounded-xl bg-slate-50 border-none shadow-inner" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-slate-400">MR Records No.</Label>
                        <Input value={newBaby.mrNumber} onChange={e => setNewBaby({...newBaby, mrNumber: e.target.value})} className="rounded-xl bg-slate-50 border-none shadow-inner" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Mother Unique ID</Label>
                        <Input value={newBaby.motherUniqueId} onChange={e => setNewBaby({...newBaby, motherUniqueId: e.target.value})} className="rounded-xl bg-slate-50 border-none shadow-inner" />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="font-black text-xs uppercase tracking-widest text-indigo-600 border-b border-indigo-50 pb-2">High Risk Register (HRR Factors)</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4">
                      {HRR_FACTORS.map(factor => (
                        <div key={factor} className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id={factor}
                            checked={newBaby.highRiskFactors.includes(factor)}
                            onChange={e => {
                              if (e.target.checked) setNewBaby({...newBaby, highRiskFactors: [...newBaby.highRiskFactors, factor]});
                              else setNewBaby({...newBaby, highRiskFactors: newBaby.highRiskFactors.filter(f => f !== factor)});
                            }}
                            className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <Label htmlFor={factor} className="text-xs font-medium text-slate-600 cursor-pointer">{factor}</Label>
                        </div>
                      ))}
                    </div>
                  </section>

                  <Button type="submit" className="w-full h-14 bg-indigo-600 rounded-2xl font-black text-xl shadow-xl shadow-indigo-100 hover:scale-[1.01] transition-all text-white">Initialize Patient Profile</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {isSpecialist && (
        <div className="flex items-center gap-2 p-1.5 bg-muted rounded-2xl w-fit border border-border/50">
          <Button 
            variant={filter === 'all' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setFilter('all')}
            className={`rounded-xl px-4 h-8 text-[10px] font-black uppercase tracking-widest ${filter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-muted-foreground hover:bg-card'}`}
          >
            All Infants
          </Button>
          <Button 
            variant={filter === 'high-risk' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setFilter('high-risk')}
            className={`rounded-xl px-4 h-8 text-[10px] font-black uppercase tracking-widest ${filter === 'high-risk' ? 'bg-rose-600 text-white shadow-md' : 'text-muted-foreground hover:bg-card'}`}
          >
            High Risk Registry
          </Button>
          <Button 
            variant={filter === 'stable' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setFilter('stable')}
            className={`rounded-xl px-4 h-8 text-[10px] font-black uppercase tracking-widest ${filter === 'stable' ? 'bg-emerald-600 text-white shadow-md' : 'text-muted-foreground hover:bg-card'}`}
          >
            Stable Monitoring
          </Button>
        </div>
      )}

      {isSpecialist && (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card className="metric-card rounded-[28px] border-none">
            <CardContent className="p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Average Birth Weight</div>
              <div className="mt-2 text-3xl font-black tracking-tight text-foreground">{avgBirthWeight || '--'}g</div>
            </CardContent>
          </Card>
          <Card className="metric-card rounded-[28px] border-none">
            <CardContent className="p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Average Gestation</div>
              <div className="mt-2 text-3xl font-black tracking-tight text-foreground">{avgGestation || '--'}w</div>
            </CardContent>
          </Card>
          <Card className="metric-card rounded-[28px] border-none">
            <CardContent className="p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Urban Babies</div>
              <div className="mt-2 text-3xl font-black tracking-tight text-foreground">{urbanCount}</div>
            </CardContent>
          </Card>
          <Card className="metric-card rounded-[28px] border-none">
            <CardContent className="p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Rural Babies</div>
              <div className="mt-2 text-3xl font-black tracking-tight text-foreground">{ruralCount}</div>
            </CardContent>
          </Card>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {babies
            .filter(b => {
              const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase());
              const matchesFilter = filter === 'all' || (filter === 'high-risk' && b.highRiskFactors?.length > 0) || (filter === 'stable' && !b.highRiskFactors?.length);
              return matchesSearch && matchesFilter;
            })
            .map((baby) => (
            <motion.div
              key={baby.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8, scale: 1.02 }}
              layout
              className="h-full relative group"
            >
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Badge variant="secondary" className={`${baby.highRiskFactors?.length > 0 ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100'} font-black text-[10px] uppercase border shadow-sm`}>
                  {baby.highRiskFactors?.length > 0 ? 'HIGH RISK' : 'STABLE'}
                </Badge>
                
                {isSpecialist && (
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      setDeleteConfirmId(baby.id);
                    }}
                    className="p-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-border"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <Link to={`/baby/${baby.id}`}>
                <Card className={`h-full border transition-all cursor-pointer relative overflow-hidden p-2 rounded-[32px] bg-card shadow-sm hover:shadow-2xl ${
                  baby.highRiskFactors?.length > 0 ? 'hover:shadow-rose-200 dark:hover:shadow-rose-900/20' : 'hover:shadow-indigo-100 dark:hover:shadow-indigo-950/20'
                }`}>
                  <CardHeader className="pb-4 pt-6 px-6">
                    <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300 ${
                      baby.highRiskFactors?.length > 0 ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600' : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600'
                    }`}>
                      <BabyIcon className="w-8 h-8 transition-colors group-hover:text-white" />
                    </div>
                    <CardTitle className="text-2xl font-black text-foreground tracking-tight group-hover:text-indigo-600 transition-colors">{baby.name}</CardTitle>
                    <div className="flex flex-wrap gap-2 mt-1">
                       <Badge variant="outline" className="bg-muted border-none text-muted-foreground font-bold text-[10px] uppercase">{baby.gestationalAgeAtBirth}w GA</Badge>
                       <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 border-none text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase">{baby.birthWeight}g</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 text-sm">
                    {baby.highRiskFactors?.length > 0 && (
                      <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter mb-4 line-clamp-1 italic">
                        {baby.highRiskFactors[0]}{baby.highRiskFactors.length > 1 ? ` +${baby.highRiskFactors.length-1} more` : ''}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-bold text-muted-foreground">Born {format(new Date(baby.dob), 'MMM dd')}</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
          <DialogContent className="rounded-[32px] border-none shadow-2xl p-8 max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-foreground mb-2">Delete Profile?</DialogTitle>
              <DialogDescription className="font-medium text-muted-foreground leading-relaxed">
                This will permanently erase all clinical data for this infant. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-8 gap-3 sm:flex-col">
              <Button 
                variant="destructive" 
                className="w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-200 dark:shadow-none"
                onClick={() => deleteConfirmId && handleDeleteBaby(deleteConfirmId)}
              >
                Delete Permanently
              </Button>
              <Button 
                variant="ghost" 
                className="w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {babies.length === 0 && !loading && (
          <div className="col-span-full py-24 text-center border-4 border-dashed border-slate-200 rounded-[40px] bg-slate-50/50">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BabyIcon className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-600 uppercase tracking-tight">No Active Profiles</h3>
            <p className="text-slate-400 font-medium max-w-sm mx-auto mt-2">Initialize follow-up tracking by enrolling your infant's birth profile above.</p>
          </div>
        )}
      </div>

      <section className="bg-card rounded-[40px] p-10 shadow-sm border border-border transition-colors">
        <h2 className="text-2xl font-black text-foreground mb-8 flex items-center gap-3">
          <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" />
          Clinical Resources
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ResourceCard 
            title={CLINICAL_GUIDELINES.kmc.title} 
            desc="Thermal regulation & bonding guide." 
            color="bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/50" 
            tag="Thermal" 
            content={CLINICAL_GUIDELINES.kmc.content}
          />
          <ResourceCard 
            title={CLINICAL_GUIDELINES.feeding.title} 
            desc="Nutritional transition strategies." 
            color="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50" 
            tag="Nutrition" 
            content={CLINICAL_GUIDELINES.feeding.content}
          />
          <ResourceCard 
            title={CLINICAL_GUIDELINES.sleep.title} 
            desc="Environment & monitoring protocols." 
            color="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50" 
            tag="Protocol" 
            content={CLINICAL_GUIDELINES.sleep.content}
          />
          <ResourceCard 
            title={CLINICAL_GUIDELINES.govt.title} 
            desc="Karnataka specific follow-up alerts." 
            color="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50" 
            tag="Regulatory" 
            content={CLINICAL_GUIDELINES.govt.content}
          />
        </div>
      </section>
    </div>

  );
}

function ResourceCard({ title, desc, color, tag, content }: { title: string, desc: string, color: string, tag: string, content: string }) {
  return (
    <Dialog>
      <DialogTrigger nativeButton={false} render={
        <motion.div whileHover={{ y: -5, scale: 1.02 }} className="h-full">
          <Card className="border border-border shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col h-full rounded-[24px] overflow-hidden bg-card">
            <CardHeader className="p-5 flex-1">
              <div className={`p-2 rounded-lg w-fit mb-4 ${color} font-black text-[9px] uppercase tracking-widest border`}>
                {tag}
              </div>
              <CardTitle className="text-lg font-black text-foreground leading-tight group-hover:text-indigo-600 transition-colors">{title}</CardTitle>
              <CardDescription className="text-xs leading-relaxed font-medium mt-2 text-muted-foreground">{desc}</CardDescription>
            </CardHeader>
            <div className="px-5 pb-5 mt-auto">
              <div className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                Read Guide <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </Card>
        </motion.div>
      } />
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto rounded-[32px] border-none shadow-2xl p-0 bg-background">
        <div className="p-10">
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
          <DialogFooter className="mt-8 border-t pt-6">
            <DialogClose nativeButton={false} render={
              <Button className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white">I Understand</Button>
            } />
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
