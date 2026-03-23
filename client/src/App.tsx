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
import { useAuth } from "./_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { getLoginUrl } from "./const";

// Protected route wrapper that redirects to OAuth if not authenticated
function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { isAuthenticated, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect directly to OAuth login
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
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/srs"} component={() => <ProtectedRoute component={SRSReview} />} />
      <Route path={"/writing"} component={() => <ProtectedRoute component={WritingPractice} />} />
      <Route path={"/videos"} component={() => <ProtectedRoute component={VideoLearning} />} />
      <Route path={"/daily-content"} component={() => <ProtectedRoute component={DailyContent} />} />
      <Route path={"/ai-course"} component={() => <ProtectedRoute component={AICourseGenerator} />} />
      <Route path={"/my-courses"} component={() => <ProtectedRoute component={MyCourses} />} />
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
