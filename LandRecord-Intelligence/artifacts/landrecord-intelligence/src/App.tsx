import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { AppShell } from '@/components/AppShell';
import { demoRecord } from '@/data/mockData';
import { Workspace } from '@/pages/Workspace';
import { UploadPage } from '@/pages/Upload';
import { ProcessPage } from '@/pages/Process';
import { RecordPage } from '@/pages/Record';
import { ValidationPage } from '@/pages/Validation';
import { GisPage } from '@/pages/Gis';
import { RiskPage } from '@/pages/Risk';
import { ReviewPage } from '@/pages/Review';
import { HistoryPage } from '@/pages/History';
import { ArchitecturePage } from '@/pages/Architecture';
import { ConcernPage } from '@/pages/Concern';
import DigitalReference from '@/pages/DigitalReference';
import { GrievanceDetail, OfficialDashboard, OfficialGrievances, OfficialLogin } from '@/pages/Official';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  const [record] = useState(demoRecord);
  const [, setLocation] = useLocation();
  const [officialAuthed, setOfficialAuthed] = useState(false);
  return <RoutedErrorBoundary>
    <AppShell record={record}>
      <Switch>
        <Route path="/" component={() => <Workspace onLoad={() => setLocation('/processing')} />} />
        <Route path="/upload" component={UploadPage} />
        <Route path="/processing" component={ProcessPage} />
        <Route path="/record" component={RecordPage} />
        <Route path="/validation" component={ValidationPage} />
        <Route path="/gis" component={GisPage} />
        <Route path="/risk" component={RiskPage} />
        <Route path="/review" component={ReviewPage} />
        <Route path="/history" component={HistoryPage} />
        <Route path="/architecture" component={ArchitecturePage} />
        <Route path="/digital-reference" component={DigitalReference} />
        <Route path="/concern" component={() => <ConcernPage />} />
        <Route path="/official" component={() => officialAuthed ? <OfficialDashboard /> : <OfficialLogin onLogin={() => { setOfficialAuthed(true); setLocation('/official/dashboard'); }} />} />
        <Route path="/official/dashboard" component={() => officialAuthed ? <OfficialDashboard /> : <OfficialLogin onLogin={() => { setOfficialAuthed(true); setLocation('/official/dashboard'); }} />} />
        <Route path="/official/grievances" component={() => officialAuthed ? <OfficialGrievances /> : <OfficialLogin onLogin={() => { setOfficialAuthed(true); setLocation('/official/grievances'); }} />} />
        <Route path="/official/grievances/:id" component={() => officialAuthed ? <GrievanceDetail /> : <OfficialLogin onLogin={() => { setOfficialAuthed(true); setLocation('/official/grievances'); }} />} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  </RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
