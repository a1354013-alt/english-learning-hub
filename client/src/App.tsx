import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import SRSReview from "./pages/SRSReview";
import WritingPractice from "./pages/WritingPractice";
import VideoLearning from "./pages/VideoLearning";
import DailyContent from "./pages/DailyContent";
import AICourseGenerator from "./pages/AICourseGenerator";
import MyCourses from "./pages/MyCourses";
import SubmissionHistory from "./pages/SubmissionHistory";
import { useAuth } from "./_core/hooks/useAuth";

import { useEffect } from "react";
import { getLoginUrl } from "./const";

// Protected route wrapper that redirects to OAuth if not authenticated
function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!loading && !isAuthenticated) {
      // Redirect to OAuth login portal
      window.location.href = getLoginUrl();
    }
  }, [isAuthenticated, loading]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null;
  }
  
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/srs"} component={() => <ProtectedLayout><SRSReview /></ProtectedLayout>} />
      <Route path={"/writing"} component={() => <ProtectedLayout><WritingPractice /></ProtectedLayout>} />
      <Route path={"/videos"} component={() => <ProtectedLayout><VideoLearning /></ProtectedLayout>} />
      <Route path={"/daily-content"} component={() => <ProtectedLayout><DailyContent /></ProtectedLayout>} />
      <Route path={"/ai-course"} component={() => <ProtectedLayout><AICourseGenerator /></ProtectedLayout>} />
      <Route path={"/my-courses"} component={() => <ProtectedLayout><MyCourses /></ProtectedLayout>} />
      <Route path={"/submission-history"} component={() => <ProtectedLayout><SubmissionHistory /></ProtectedLayout>} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
